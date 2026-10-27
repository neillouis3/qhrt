import type { SupabaseClient } from '@supabase/supabase-js';
import { toDateKey } from '@/lib/dateKey';
import type { NameSource } from '@/lib/userName';
import type { DiaryMood } from '@/lib/types/diary';

export type HomeCheckInValue = 'up' | 'down';

export interface HomeCheckInDay {
  date: string;
  value: HomeCheckInValue;
}

export interface CheckInWeekDay {
  date: string;
  value: HomeCheckInValue | null;
  /** Day just outside the Sunday–Saturday week, shown faded on the edge. */
  edge?: boolean;
}

export const HOME_CHECK_IN_DIARY_TITLE = 'Home check-in';

const MAX_HISTORY = 14;
const MAX_PRESENCE_DAYS = 120;

export function isHomeCheckInValue(value: unknown): value is HomeCheckInValue {
  return value === 'up' || value === 'down';
}

function parseDay(raw: unknown): HomeCheckInDay | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const date = typeof record.date === 'string' ? record.date : '';
  const value = record.value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  if (value !== 'up' && value !== 'down') return null;
  return { date, value };
}

export function homeCheckInDayFromUser(user: NameSource, dateKey = toDateKey(new Date())): HomeCheckInValue | null {
  const day = parseDay(user?.user_metadata?.home_check_in_day);
  if (!day || day.date !== dateKey) return null;
  return day.value;
}

export function checkInHistoryFromMetadata(meta: Record<string, unknown> | undefined): HomeCheckInDay[] {
  const byDate = new Map<string, HomeCheckInValue>();

  if (Array.isArray(meta?.home_check_in_history)) {
    for (const entry of meta.home_check_in_history) {
      const day = parseDay(entry);
      if (day) byDate.set(day.date, day.value);
    }
  }

  const dayField = parseDay(meta?.home_check_in_day);
  if (dayField) byDate.set(dayField.date, dayField.value);

  return [...byDate.entries()]
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, MAX_HISTORY);
}

export function appendCheckInHistory(
  meta: Record<string, unknown>,
  date: string,
  value: HomeCheckInValue
): HomeCheckInDay[] {
  return [{ date, value }, ...checkInHistoryFromMetadata(meta).filter((day) => day.date !== date)]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, MAX_HISTORY);
}

export function buildCheckInWeek(
  meta: Record<string, unknown> | undefined,
  todayKey = toDateKey(new Date())
): CheckInWeekDay[] {
  const byDate = new Map(checkInHistoryFromMetadata(meta).map((day) => [day.date, day.value]));
  const today = new Date(`${todayKey}T12:00:00`);
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay());
  const start = new Date(sunday);
  start.setDate(sunday.getDate() - 1);
  const week: CheckInWeekDay[] = [];
  for (let offset = 0; offset < 9; offset += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + offset);
    const key = toDateKey(date);
    week.push({
      date: key,
      value: byDate.get(key) ?? null,
      edge: offset === 0 || offset === 8,
    });
  }
  return week;
}

export function weekHasCheckIns(week: CheckInWeekDay[]): boolean {
  const core = week.filter((day) => !day.edge);
  const days = core.length > 0 ? core : week;
  return days.some((day) => day.value !== null);
}

export function diaryMoodFromCheckIn(value: HomeCheckInValue): DiaryMood {
  return value === 'up' ? 4 : 2;
}

export function checkInValueFromDiaryMood(mood: DiaryMood | null | undefined): HomeCheckInValue | null {
  if (mood == null) return null;
  if (mood >= 4) return 'up';
  if (mood <= 2) return 'down';
  return null;
}

export function isHomeCheckInDiaryEntry(entry: { title?: string | null }): boolean {
  return (entry.title ?? '').trim() === HOME_CHECK_IN_DIARY_TITLE;
}

export async function syncCheckInToDiary(
  db: SupabaseClient,
  userId: string,
  entryDate: string,
  value: HomeCheckInValue
): Promise<void> {
  const mood = diaryMoodFromCheckIn(value);
  const body =
    value === 'up' ? 'Quick check-in — feeling okay today.' : 'Quick check-in — a harder day.';
  const now = new Date().toISOString();

  const { data: existing, error: findError } = await db
    .from('diary_entries')
    .select('id')
    .eq('user_id', userId)
    .eq('entry_date', entryDate)
    .eq('title', HOME_CHECK_IN_DIARY_TITLE)
    .maybeSingle();
  if (findError) throw findError;

  if (existing?.id) {
    const { error: updateError } = await db
      .from('diary_entries')
      .update({ body, mood, updated_at: now })
      .eq('id', existing.id)
      .eq('user_id', userId);
    if (updateError) throw updateError;
    return;
  }

  const { error: insertError } = await db.from('diary_entries').insert({
    user_id: userId,
    entry_date: entryDate,
    title: HOME_CHECK_IN_DIARY_TITLE,
    body,
    mood,
  });
  if (insertError) throw insertError;
}

export async function backfillCheckInsToDiary(
  db: SupabaseClient,
  userId: string,
  meta: Record<string, unknown>
): Promise<void> {
  for (const day of checkInHistoryFromMetadata(meta)) {
    await syncCheckInToDiary(db, userId, day.date, day.value);
  }
}

export function buildCheckInByDate(
  meta: Record<string, unknown> | undefined,
  entries: Array<{ entry_date: string; title: string | null; mood: number | null }>
): Map<string, HomeCheckInValue> {
  const map = new Map<string, HomeCheckInValue>();
  for (const entry of entries) {
    if (!isHomeCheckInDiaryEntry(entry)) continue;
    const value = checkInValueFromDiaryMood(entry.mood as DiaryMood | null);
    if (value) map.set(entry.entry_date, value);
  }
  for (const day of checkInHistoryFromMetadata(meta)) {
    map.set(day.date, day.value);
  }
  return map;
}

export function checkInsFromMap(map: Map<string, HomeCheckInValue>): HomeCheckInDay[] {
  return [...map.entries()]
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function presenceDaysFromUserMetadata(meta: Record<string, unknown> | undefined): string[] {
  const raw = meta?.presence_days;
  if (!Array.isArray(raw)) return [];
  return [
    ...new Set(raw.filter((item): item is string => typeof item === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item))),
  ].slice(-MAX_PRESENCE_DAYS);
}

export function appendPresenceDay(existing: string[], dateKey = toDateKey(new Date())): string[] {
  return [...existing.filter((key) => key !== dateKey), dateKey].slice(-MAX_PRESENCE_DAYS);
}
