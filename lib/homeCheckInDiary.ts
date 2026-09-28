import type { SupabaseClient } from '@supabase/supabase-js';
import type { HomeCheckInValue } from '@/lib/homeCheckIn';
import { checkInHistoryFromMetadata } from '@/lib/homeCheckInHistory';
import type { DiaryMood } from '@/lib/types/diary';

export const HOME_CHECK_IN_DIARY_TITLE = 'Home check-in';

export function diaryMoodFromCheckIn(value: HomeCheckInValue): DiaryMood {
  return value === 'up' ? 4 : 2;
}

export function checkInValueFromDiaryMood(mood: DiaryMood | null | undefined): HomeCheckInValue | null {
  if (mood == null) return null;
  if (mood >= 4) return 'up';
  if (mood <= 2) return 'down';
  return null;
}

export function checkInDiaryBody(value: HomeCheckInValue): string {
  return value === 'up'
    ? 'Quick check-in — feeling okay today.'
    : 'Quick check-in — a harder day.';
}

export function isHomeCheckInDiaryEntry(entry: { title?: string | null }): boolean {
  return (entry.title ?? '').trim() === HOME_CHECK_IN_DIARY_TITLE;
}

/** Upsert the auto diary row for a home thumbs check-in. */
export async function syncCheckInToDiary(
  db: SupabaseClient,
  userId: string,
  entryDate: string,
  value: HomeCheckInValue
): Promise<void> {
  const mood = diaryMoodFromCheckIn(value);
  const body = checkInDiaryBody(value);
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

/** One-time backfill: metadata history → diary rows (idempotent). */
export async function backfillCheckInsToDiary(
  db: SupabaseClient,
  userId: string,
  meta: Record<string, unknown>
): Promise<void> {
  for (const day of checkInHistoryFromMetadata(meta)) {
    await syncCheckInToDiary(db, userId, day.date, day.value);
  }
}
