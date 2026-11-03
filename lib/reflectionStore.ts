import { missingRelation } from '@/lib/apiError';
import {
  REFLECTION_CONTENT_VERSION,
  REFLECTION_SOURCE_DOMAIN,
  isReflectionDomain,
  cleanReflectionField,
  cleanReflectionNote,
  isReflectionState,
  type ReflectionState,
} from '@/lib/reflection';
import { supabaseServer } from '@/lib/supabaseClient';

export const REFLECTION_SCHEMA = 'supabase/022_reflection_library.sql';

const KEY_PATTERN = /^[A-Z0-9_]+$/;
const LOCALE_PATTERN = /^[a-z]{2}(-[A-Z]{2})?$/;

export type ClarifierRow = {
  id: string;
  clarifierKey: string;
  body: string;
  allowsCustom: boolean;
  displayOrder: number;
  enabled: boolean;
  locale: string;
};

export type ThemeRow = {
  id: string;
  themeKey: string;
  domain: string;
  label: string;
  locale: string;
  displayOrder: number;
  enabled: boolean;
  contentVersion: string;
  clarifiers: ClarifierRow[];
};

export type SessionView = {
  id: string;
  status: 'ACTIVE' | 'COMPLETED';
  state: ReflectionState;
  sourceDomain: string;
  themeId: string | null;
  themeKey: string;
  themeSnapshot: string;
  clarifierId: string | null;
  clarifierSnapshot: string;
  customClarifierText: string;
  contentVersion: string;
  locale: string;
  breathPhase: 'ask' | 'breathe' | 'zero';
  ratings: number[];
  perspectiveText: string;
  observationChoice: string;
  observationNote: string;
  nextStep: string;
  createdAt: string;
};

type ThemeRecord = {
  id: string;
  theme_key: string;
  domain: string;
  label: string;
  locale: string;
  display_order: number;
  enabled: boolean;
  content_version: string;
};

type ClarifierRecord = {
  id: string;
  theme_id: string;
  clarifier_key: string;
  body: string;
  allows_custom: boolean;
  locale: string;
  display_order: number;
  enabled: boolean;
};

type SessionRecord = {
  id: string;
  user_id: string;
  status: 'ACTIVE' | 'COMPLETED';
  current_state: string;
  source_domain: string;
  theme_id: string | null;
  theme_key: string;
  theme_snapshot: string;
  clarifier_id: string | null;
  clarifier_snapshot: string;
  custom_clarifier_text: string;
  content_version: string;
  locale: string;
  breath_phase: string;
  ratings: number[] | null;
  perspective_text: string;
  observation_choice: string;
  observation_note: string;
  next_step: string;
  created_at: string;
};

function isMissing(error: { code?: string; message?: string } | null): boolean {
  return Boolean(error && missingRelation(error));
}

function mapClarifier(row: ClarifierRecord): ClarifierRow {
  return {
    id: row.id,
    clarifierKey: row.clarifier_key,
    body: row.body,
    allowsCustom: row.allows_custom,
    displayOrder: row.display_order,
    enabled: row.enabled,
    locale: row.locale,
  };
}

function mapSession(row: SessionRecord): SessionView {
  const state = isReflectionState(row.current_state) ? row.current_state : 'THEME_INTRO';
  const breathPhase = row.breath_phase === 'breathe' || row.breath_phase === 'zero' ? row.breath_phase : 'ask';
  return {
    id: row.id,
    status: row.status,
    state,
    sourceDomain: row.source_domain,
    themeId: row.theme_id,
    themeKey: row.theme_key,
    themeSnapshot: row.theme_snapshot,
    clarifierId: row.clarifier_id,
    clarifierSnapshot: row.clarifier_snapshot,
    customClarifierText: row.custom_clarifier_text,
    contentVersion: row.content_version,
    locale: row.locale,
    breathPhase,
    ratings: Array.isArray(row.ratings) ? row.ratings.filter((item) => Number.isInteger(item)) : [],
    perspectiveText: row.perspective_text ?? '',
    observationChoice: row.observation_choice ?? '',
    observationNote: row.observation_note ?? '',
    nextStep: row.next_step ?? '',
    createdAt: row.created_at,
  };
}

export async function listReflectionThemes(options: {
  domain?: string;
  locale?: string;
  includeDisabled?: boolean;
}): Promise<{ themes: ThemeRow[] } | { missing: true }> {
  const domain = options.domain || REFLECTION_SOURCE_DOMAIN;
  const locale = options.locale || 'en';
  let themeQuery = supabaseServer
    .from('reflection_themes')
    .select('id, theme_key, domain, label, locale, display_order, enabled, content_version')
    .eq('domain', domain)
    .eq('locale', locale)
    .order('display_order', { ascending: true });
  if (!options.includeDisabled) themeQuery = themeQuery.eq('enabled', true);
  const { data: themes, error } = await themeQuery;
  if (error) {
    if (isMissing(error)) return { missing: true };
    throw error;
  }
  const themeRows = (themes ?? []) as ThemeRecord[];
  if (themeRows.length === 0) return { themes: [] };
  let clarifierQuery = supabaseServer
    .from('reflection_clarifiers')
    .select('id, theme_id, clarifier_key, body, allows_custom, locale, display_order, enabled')
    .in('theme_id', themeRows.map((theme) => theme.id))
    .order('display_order', { ascending: true });
  if (!options.includeDisabled) clarifierQuery = clarifierQuery.eq('enabled', true);
  const { data: clarifiers, error: clarifierError } = await clarifierQuery;
  if (clarifierError) {
    if (isMissing(clarifierError)) return { missing: true };
    throw clarifierError;
  }
  const byTheme = new Map<string, ClarifierRow[]>();
  for (const row of (clarifiers ?? []) as ClarifierRecord[]) {
    const list = byTheme.get(row.theme_id) ?? [];
    list.push(mapClarifier(row));
    byTheme.set(row.theme_id, list);
  }
  return {
    themes: themeRows.map((theme) => ({
      id: theme.id,
      themeKey: theme.theme_key,
      domain: theme.domain,
      label: theme.label,
      locale: theme.locale,
      displayOrder: theme.display_order,
      enabled: theme.enabled,
      contentVersion: theme.content_version,
      clarifiers: byTheme.get(theme.id) ?? [],
    })),
  };
}

export function cleanLocale(value: string): string {
  const locale = value.trim();
  return LOCALE_PATTERN.test(locale) ? locale : '';
}

export function cleanThemeKey(value: string): string {
  const key = value.trim().toUpperCase().replace(/[\s-]+/g, '_');
  return KEY_PATTERN.test(key) ? key : '';
}

export async function createReflectionSession(input: {
  userId: string;
  themeId: string;
  clarifierId?: string;
  customClarifierText?: string;
  locale?: string;
  sleepPatternId?: string;
  sourceModuleProgressId?: string;
}): Promise<{ session: SessionView } | { missing: true } | { error: string; status: number }> {
  const locale = cleanLocale(input.locale || 'en') || 'en';
  const { data: theme, error: themeError } = await supabaseServer
    .from('reflection_themes')
    .select('id, theme_key, domain, label, locale, content_version, enabled')
    .eq('id', input.themeId)
    .maybeSingle();
  if (themeError) {
    if (isMissing(themeError)) return { missing: true };
    throw themeError;
  }
  if (!theme || !theme.enabled || !isReflectionDomain(theme.domain) || theme.locale !== locale) {
    return { error: 'Choose a theme from this lesson.', status: 400 };
  }

  const custom = cleanReflectionField(input.customClarifierText ?? '', 400);
  let clarifierId: string | null = null;
  let clarifierSnapshot = '';
  if (input.clarifierId) {
    const { data: clarifier, error: clarifierError } = await supabaseServer
      .from('reflection_clarifiers')
      .select('id, theme_id, body, allows_custom, enabled')
      .eq('id', input.clarifierId)
      .maybeSingle();
    if (clarifierError) {
      if (isMissing(clarifierError)) return { missing: true };
      throw clarifierError;
    }
    if (!clarifier || !clarifier.enabled || clarifier.theme_id !== theme.id) {
      return { error: 'Choose a clarifying statement for this theme.', status: 400 };
    }
    clarifierId = clarifier.id;
    clarifierSnapshot = clarifier.body;
    if (clarifier.allows_custom && !custom) {
      return { error: 'Write the statement that fits, or choose a listed one.', status: 400 };
    }
  } else if (theme.theme_key === 'OTHER') {
    if (!custom) return { error: 'Write the theme in your own words.', status: 400 };
    clarifierSnapshot = custom;
  } else {
    return { error: 'Choose a clarifying statement for this theme.', status: 400 };
  }

  const { data, error } = await supabaseServer
    .from('reflection_sessions')
    .insert({
      user_id: input.userId,
      status: 'ACTIVE',
      current_state: 'THEME_INTRO',
      source_domain: theme.domain,
      theme_id: theme.id,
      theme_key: theme.theme_key,
      theme_snapshot: theme.label,
      clarifier_id: clarifierId,
      clarifier_snapshot: clarifierSnapshot,
      custom_clarifier_text: custom,
      content_version: theme.content_version || REFLECTION_CONTENT_VERSION,
      locale,
      sleep_pattern_id: cleanReflectionField(input.sleepPatternId ?? '', 80) || null,
      source_module_progress_id: cleanReflectionField(input.sourceModuleProgressId ?? '', 80) || null,
    })
    .select('*')
    .single();
  if (error) {
    if (isMissing(error)) return { missing: true };
    throw error;
  }
  return { session: mapSession(data as SessionRecord) };
}

export async function listReflectionSessions(userId: string): Promise<{ sessions: SessionView[] } | { missing: true }> {
  const { data, error } = await supabaseServer
    .from('reflection_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) {
    if (isMissing(error)) return { missing: true };
    throw error;
  }
  return { sessions: ((data ?? []) as SessionRecord[]).map(mapSession) };
}

export async function readReflectionSession(
  userId: string,
  sessionId: string
): Promise<{ session: SessionView } | { missing: true } | { error: string; status: number }> {
  const { data, error } = await supabaseServer
    .from('reflection_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    if (isMissing(error)) return { missing: true };
    throw error;
  }
  if (!data) return { error: 'That reflection session was not found.', status: 404 };
  return { session: mapSession(data as SessionRecord) };
}

export async function updateReflectionSession(
  userId: string,
  sessionId: string,
  patch: {
    state?: string;
    breathPhase?: string;
    ratings?: number[];
    perspectiveText?: string;
    observationChoice?: string;
    observationNote?: string;
    nextStep?: string;
    status?: string;
  }
): Promise<{ session: SessionView } | { missing: true } | { error: string; status: number }> {
  const current = await readReflectionSession(userId, sessionId);
  if (!('session' in current)) return current;
  if (current.session.status !== 'ACTIVE') {
    return { error: 'This reflection is already stored. Start a new one to explore a theme again.', status: 409 };
  }
  const next: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.state !== undefined) {
    if (!isReflectionState(patch.state)) return { error: 'That step is not part of this reflection.', status: 400 };
    next.current_state = patch.state;
  }
  if (patch.breathPhase !== undefined) {
    if (patch.breathPhase !== 'ask' && patch.breathPhase !== 'breathe' && patch.breathPhase !== 'zero') {
      return { error: 'That step is not part of this reflection.', status: 400 };
    }
    next.breath_phase = patch.breathPhase;
  }
  if (patch.ratings !== undefined) {
    if (!Array.isArray(patch.ratings) || patch.ratings.some((item) => !Number.isInteger(item) || item < 0 || item > 10)) {
      return { error: 'Ratings must stay between 0 and 10.', status: 400 };
    }
    next.ratings = patch.ratings.slice(0, 30);
  }
  if (patch.perspectiveText !== undefined) next.perspective_text = cleanReflectionField(patch.perspectiveText, 400);
  if (patch.observationChoice !== undefined) next.observation_choice = cleanReflectionField(patch.observationChoice, 80);
  if (patch.observationNote !== undefined) next.observation_note = cleanReflectionNote(patch.observationNote);
  if (patch.nextStep !== undefined) next.next_step = cleanReflectionField(patch.nextStep, 40);
  if (patch.status !== undefined) {
    if (patch.status !== 'COMPLETED') return { error: 'That step is not part of this reflection.', status: 400 };
    next.status = 'COMPLETED';
  }
  const { data, error } = await supabaseServer
    .from('reflection_sessions')
    .update(next)
    .eq('id', sessionId)
    .eq('user_id', userId)
    .select('*')
    .single();
  if (error) {
    if (isMissing(error)) return { missing: true };
    throw error;
  }
  return { session: mapSession(data as SessionRecord) };
}

export async function saveReflectionTheme(input: {
  id?: string;
  themeKey: string;
  label: string;
  locale: string;
  displayOrder: number;
  enabled: boolean;
  domain?: string;
}): Promise<{ theme: ThemeRecord } | { missing: true } | { error: string; status: number }> {
  const themeKey = cleanThemeKey(input.themeKey);
  const locale = cleanLocale(input.locale);
  const label = cleanReflectionField(input.label, 80);
  if (!themeKey || !locale || !label || !Number.isInteger(input.displayOrder)) {
    return { error: 'A theme needs a key, a label, a locale, and an order.', status: 400 };
  }
  const row = {
    theme_key: themeKey,
    domain: cleanThemeKey(input.domain || REFLECTION_SOURCE_DOMAIN) || REFLECTION_SOURCE_DOMAIN,
    label,
    locale,
    display_order: input.displayOrder,
    enabled: input.enabled,
    content_version: REFLECTION_CONTENT_VERSION,
    updated_at: new Date().toISOString(),
  };
  const query = input.id
    ? supabaseServer.from('reflection_themes').update(row).eq('id', input.id)
    : supabaseServer.from('reflection_themes').insert(row);
  const { data, error } = await query.select('id, theme_key, domain, label, locale, display_order, enabled, content_version').single();
  if (error) {
    if (isMissing(error)) return { missing: true };
    if (error.code === '23505') return { error: 'That theme key already exists for this locale.', status: 409 };
    throw error;
  }
  return { theme: data as ThemeRecord };
}

export async function saveReflectionClarifier(input: {
  id?: string;
  themeId: string;
  clarifierKey: string;
  body: string;
  allowsCustom: boolean;
  locale: string;
  displayOrder: number;
  enabled: boolean;
}): Promise<{ clarifier: ClarifierRecord } | { missing: true } | { error: string; status: number }> {
  const clarifierKey = cleanThemeKey(input.clarifierKey);
  const locale = cleanLocale(input.locale);
  const body = cleanReflectionField(input.body, 400);
  if (!input.themeId || !clarifierKey || !locale || !body || !Number.isInteger(input.displayOrder)) {
    return { error: 'A statement needs a theme, a key, the words, a locale, and an order.', status: 400 };
  }
  const row = {
    theme_id: input.themeId,
    clarifier_key: clarifierKey,
    body,
    allows_custom: input.allowsCustom,
    locale,
    display_order: input.displayOrder,
    enabled: input.enabled,
    content_version: REFLECTION_CONTENT_VERSION,
    updated_at: new Date().toISOString(),
  };
  const query = input.id
    ? supabaseServer.from('reflection_clarifiers').update(row).eq('id', input.id)
    : supabaseServer.from('reflection_clarifiers').insert(row);
  const { data, error } = await query
    .select('id, theme_id, clarifier_key, body, allows_custom, locale, display_order, enabled')
    .single();
  if (error) {
    if (isMissing(error)) return { missing: true };
    if (error.code === '23505') return { error: 'That statement key already exists on this theme.', status: 409 };
    throw error;
  }
  return { clarifier: data as ClarifierRecord };
}
