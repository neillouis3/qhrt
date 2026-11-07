/**
 * Applies supabase/017_assessment_kind_and_readiness.sql to the linked project.
 * Uses DATABASE_URL / postgres-meta when available, then Rest for the seed row.
 * Never prints secrets.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sqlPath = join(root, 'supabase', '017_assessment_kind_and_readiness.sql');

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

function fetchWithoutOpaqueBearer(apiKey) {
  return async (input, init) => {
    const headers = new Headers(init?.headers);
    if (
      (apiKey.startsWith('sb_publishable_') || apiKey.startsWith('sb_secret_')) &&
      headers.get('Authorization') === `Bearer ${apiKey}`
    ) {
      headers.delete('Authorization');
    }
    return fetch(input, { ...init, headers });
  };
}

function jsonFromSql(sql, tag) {
  const open = `$${tag}$`;
  const start = sql.indexOf(open);
  const end = sql.lastIndexOf(open);
  if (start < 0 || end <= start) throw new Error(`Could not find $${tag}$ in 017 SQL.`);
  return JSON.parse(sql.slice(start + open.length, end));
}

function dollarText(sql, tag) {
  const open = `$${tag}$`;
  const start = sql.indexOf(open);
  const end = sql.indexOf(open, start + open.length);
  if (start < 0 || end <= start) return null;
  return sql.slice(start + open.length, end);
}

loadEnv('.env.local');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
const dbUrl =
  process.env.DATABASE_URL?.trim() ||
  process.env.POSTGRES_URL?.trim() ||
  process.env.DIRECT_URL?.trim() ||
  process.env.SUPABASE_DB_URL?.trim() ||
  process.env.POSTGRES_CONNECTION_STRING?.trim();

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local');
  process.exit(1);
}

const sql = readFileSync(sqlPath, 'utf8');

async function runSql(text) {
  if (dbUrl) {
    const result = spawnSync(
      'npx',
      ['supabase', 'db', 'query', '--yes', '--file', sqlPath, `--remote=${dbUrl}`],
      { cwd: root, encoding: 'utf8', shell: true }
    );
    if (result.status === 0) {
      console.log('Applied 017 via supabase db query.');
      return true;
    }
    console.log('supabase db query did not apply (will try other paths).');
  }

  const endpoints = [`${url.replace(/\/$/, '')}/pg/query`, `${url.replace(/\/$/, '')}/pg-meta/query`];
  for (const endpoint of endpoints) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: text }),
    });
    if (response.ok) {
      console.log('Applied 017 via', new URL(endpoint).pathname);
      return true;
    }
  }
  return false;
}

const appliedSql = await runSql(sql);

const supabase = createClient(url, key, {
  global: { fetch: fetchWithoutOpaqueBearer(key) },
  auth: { autoRefreshToken: false, persistSession: false },
});

const probe = await supabase.from('assessments').select('id, slug, kind').eq('slug', 'program-readiness').maybeSingle();
if (probe.error) {
  console.error('Readiness schema still missing:', probe.error.code || probe.error.message);
  process.exit(2);
}

if (!probe.data) {
  const row = {
    id: 'b0000000-0000-4000-8000-000000000001',
    slug: 'program-readiness',
    title: 'Are You Ready for Self-Directed QHRT?',
    description: dollarText(sql, 'd'),
    instructions: 'Your responses may recommend one of the following:',
    disclaimer: dollarText(sql, 'n'),
    cover_image: null,
    scoring_method: 'mean',
    kind: 'readiness',
    display_order: 0,
    is_active: true,
    questions: jsonFromSql(sql, 'json'),
    outcomes: jsonFromSql(sql, 'out'),
  };
  const inserted = await supabase.from('assessments').insert(row);
  if (inserted.error) {
    console.error('Could not seed program-readiness:', inserted.error.code || inserted.error.message);
    process.exit(3);
  }
  console.log('Seeded program-readiness assessment.');
} else {
  console.log('program-readiness already present.');
}

const check = await supabase
  .from('assessments')
  .select('slug, kind, is_active')
  .eq('kind', 'readiness')
  .eq('is_active', true)
  .limit(1)
  .maybeSingle();
if (check.error || !check.data) {
  console.error('Readiness row is not queryable by kind yet.');
  process.exit(4);
}
console.log('Readiness is queryable:', check.data.slug, check.data.kind);
if (!appliedSql) {
  console.log('DDL may already have been applied. Seed is in place.');
}
