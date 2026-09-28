import type { HomeCheckInDay, HomeCheckInValue } from '@/lib/homeCheckIn';
import type { DiaryMood } from '@/lib/types/diary';
import { checkInHistoryFromMetadata } from '@/lib/homeCheckInHistory';
import {
  checkInValueFromDiaryMood,
  isHomeCheckInDiaryEntry,
} from '@/lib/homeCheckInDiary';

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
