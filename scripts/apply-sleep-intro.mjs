/**
 * Writes the Sleep introduction into module_lessons (existing module table).
 * Slides come from supabase/019_module_presentations.sql. The app does not
 * hardcode them. Uses kind=presentation when the DB allows it, otherwise guide
 * (steps still carry section + voiceover; the player treats that as an intro).
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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
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

function slidesFromSql() {
  const sql = readFileSync(join(root, 'supabase', '019_module_presentations.sql'), 'utf8');
  const start = sql.indexOf('$slides$');
  const end = sql.lastIndexOf('$slides$');
  if (start < 0 || end <= start) throw new Error('Could not find slides in 019 SQL.');
  return JSON.parse(sql.slice(start + '$slides$'.length, end));
}

function looksLikeIntro(lesson) {
  if (lesson.kind === 'presentation') return true;
  if (typeof lesson.title === 'string' && lesson.title.toLowerCase().includes('introduction')) return true;
  const steps = Array.isArray(lesson.steps) ? lesson.steps : [];
  return steps.some((step) => step && (step.voiceover || step.section));
}

loadEnv('.env.local');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(url, key, {
  global: { fetch: fetchWithoutOpaqueBearer(key) },
  auth: { autoRefreshToken: false, persistSession: false },
});

const steps = slidesFromSql();
const INTRO_ID = 'b0000000-0000-4000-8000-000000000022';

const { data: module, error: moduleError } = await supabase
  .from('learning_modules')
  .select('id, slug, description')
  .eq('slug', 'sleep')
  .maybeSingle();
if (moduleError) {
  console.error('Could not load Sleep module:', moduleError.message);
  process.exit(1);
}
if (!module) {
  console.error('No Sleep module found.');
  process.exit(1);
}

const { data: lessons, error: lessonsError } = await supabase
  .from('module_lessons')
  .select('id, title, kind, position, steps')
  .eq('module_id', module.id)
  .order('position', { ascending: true });
if (lessonsError) {
  console.error('Could not load lessons:', lessonsError.message);
  process.exit(1);
}

const existing = (lessons ?? []).find((lesson) => lesson.id === INTRO_ID || looksLikeIntro(lesson));
const payload = {
  title: 'Sleep introduction',
  description: 'A short slide deck that explains this module before any questions.',
  steps,
  is_active: true,
  updated_at: new Date().toISOString(),
};

async function save(kind, extra) {
  if (existing) {
    return supabase
      .from('module_lessons')
      .update({ ...payload, kind, ...extra })
      .eq('id', existing.id)
      .select('id, position, kind, title');
  }
  return supabase
    .from('module_lessons')
    .insert({
      id: INTRO_ID,
      module_id: module.id,
      position: extra.position,
      kind,
      assessment_id: null,
      ...payload,
    })
    .select('id, position, kind, title');
}

if (!existing) {
  const ordered = [...(lessons ?? [])].sort((a, b) => b.position - a.position);
  for (const lesson of ordered) {
    const moved = await supabase
      .from('module_lessons')
      .update({ position: lesson.position + 1, updated_at: payload.updated_at })
      .eq('id', lesson.id);
    if (moved.error) {
      console.error('Could not make room for the introduction:', moved.error.message);
      process.exit(1);
    }
  }
}

let result = await save('presentation', { position: 1 });
if (result.error) {
  result = await save('guide', { position: 1 });
}
if (result.error) {
  console.error('Could not save Sleep introduction:', result.error.message);
  process.exit(1);
}

const desc = await supabase
  .from('learning_modules')
  .update({
    description: 'A short introduction, then a look at falling asleep, staying asleep, and waking.',
    updated_at: payload.updated_at,
  })
  .eq('id', module.id);
if (desc.error) {
  console.error('Saved the lesson, but could not update the Sleep description:', desc.error.message);
}

const saved = result.data?.[0];
console.log(
  `Sleep introduction is in module_lessons (${saved?.kind ?? 'saved'} · position ${saved?.position ?? 1}).`
);
