/**
 * Updates the live Sleep module titles to the two-part layout.
 * Never prints secrets.
 */
import { createClient } from '@supabase/supabase-js';
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

loadEnv('.env.local');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SECRET_KEY?.trim();
if (!url || !key) {
  console.error('Missing Supabase URL or secret key');
  process.exit(1);
}

const supabase = createClient(url, key, {
  global: { fetch: fetchWithoutOpaqueBearer(key) },
  auth: { autoRefreshToken: false, persistSession: false },
});

const introId = 'b0000000-0000-4000-8000-000000000022';
const practiceId = 'b0000000-0000-4000-8000-000000000021';

const { data: intro, error: readError } = await supabase
  .from('module_lessons')
  .select('id, steps')
  .eq('id', introId)
  .maybeSingle();
if (readError) {
  console.error('Could not read the sleep introduction:', readError.code || readError.message);
  process.exit(2);
}

const steps = Array.isArray(intro?.steps) ? intro.steps : [];
const nextSteps = steps.map((step) => {
  if (!step || step.key !== 'welcome') return step;
  return {
    ...step,
    title: 'The Foundations of Sleep',
    paragraphs: [
      'Sleep Better, Live Better',
      'Why sleep matters and practical steps to restore it.',
    ],
  };
});

const introUpdate = await supabase
  .from('module_lessons')
  .update({
    position: 1,
    title: 'The Foundations of Sleep',
    description: 'Sleep Better, Live Better\nWhy sleep matters and practical steps to restore it',
    steps: nextSteps,
  })
  .eq('id', introId)
  .select('id');
if (introUpdate.error || !introUpdate.data?.length) {
  console.error('Could not update module 1:', introUpdate.error?.code || introUpdate.error?.message || 'row missing');
  process.exit(2);
}

const practiceUpdate = await supabase
  .from('module_lessons')
  .update({
    position: 2,
    title: 'Observe, Choose, and Experiment',
    description: 'Sleep, Daily Functioning & Quality of Life',
  })
  .eq('id', practiceId)
  .select('id');
if (practiceUpdate.error || !practiceUpdate.data?.length) {
  console.error('Could not update module 2:', practiceUpdate.error?.code || practiceUpdate.error?.message || 'row missing');
  process.exit(2);
}

console.log('Updated Sleep module 1 and module 2.');
