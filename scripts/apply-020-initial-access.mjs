/**
 * Updates the live program-readiness assessment to Initial Access spec v1.0.
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

function jsonFromSql(sql, tag) {
  const open = `$${tag}$`;
  const start = sql.indexOf(open);
  const end = sql.lastIndexOf(open);
  if (start < 0 || end <= start) throw new Error(`Could not find $${tag}$`);
  return JSON.parse(sql.slice(start + open.length, end));
}

loadEnv('.env.local');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SECRET_KEY?.trim();
if (!url || !key) {
  console.error('Missing Supabase URL or secret key');
  process.exit(1);
}

const outcomes = jsonFromSql(readFileSync(join(root, 'supabase/017_assessment_kind_and_readiness.sql'), 'utf8'), 'out');
const supabase = createClient(url, key, {
  global: { fetch: fetchWithoutOpaqueBearer(key) },
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase
  .from('assessments')
  .select('id, questions')
  .eq('slug', 'program-readiness')
  .maybeSingle();
if (error) {
  console.error('Could not read readiness assessment:', error.code || error.message);
  process.exit(2);
}
if (!data) {
  console.error('No program-readiness assessment row');
  process.exit(2);
}

const questions = (data.questions ?? []).map((question) => {
  if (question.key === 'i7') return { ...question, heading: 'Additional Outside Support' };
  if (question.key === 'expect_info' && typeof question.text === 'string') {
    return {
      ...question,
      text: question.text.replace('emotion based language', 'emotional and archetypal language'),
    };
  }
  return question;
});

const { error: updateError } = await supabase
  .from('assessments')
  .update({
    questions,
    outcomes,
    instructions: 'Your responses may recommend one of the following:',
    disclaimer:
      'QHRT is a self-directed educational wellness program and is not designed for emergency or crisis situations. Responses submitted through this website are not monitored in real time.',
  })
  .eq('id', data.id);

if (updateError) {
  console.error('Could not update readiness assessment:', updateError.code || updateError.message);
  process.exit(2);
}

console.log('Updated program-readiness to Initial Access v1.0.', outcomes.map((item) => item.key).join(', '));
