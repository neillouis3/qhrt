/**
 * Applies supabase/022_reflection_library.sql.
 * Never prints secrets.
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv(file) {
  const text = readFileSync(join(root, file), 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv('.env.local');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SECRET_KEY?.trim();
if (!url || !key) {
  console.error('Missing Supabase URL or secret key');
  process.exit(1);
}

const sql = readFileSync(join(root, 'supabase/022_reflection_library.sql'), 'utf8');
const endpoints = [`${url.replace(/\/$/, '')}/pg/query`, `${url.replace(/\/$/, '')}/pg-meta/query`];
let applied = false;
for (const endpoint of endpoints) {
  const headers = new Headers({
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  });
  if (
    (key.startsWith('sb_publishable_') || key.startsWith('sb_secret_')) &&
    headers.get('Authorization') === `Bearer ${key}`
  ) {
    headers.delete('Authorization');
  }
  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: sql }),
  });
  if (response.ok) {
    console.log('Applied 022 via', new URL(endpoint).pathname);
    applied = true;
    break;
  }
}

if (!applied) {
  console.error('Could not apply 022 through the database query endpoint. Run supabase/022_reflection_library.sql in the SQL editor.');
  process.exit(2);
}
