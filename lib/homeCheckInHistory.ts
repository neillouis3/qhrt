import { toDateKey } from '@/lib/dateKey';
import type { HomeCheckInDay, HomeCheckInValue } from '@/lib/homeCheckIn';

export interface CheckInWeekDay {
  date: string;
  value: HomeCheckInValue | null;
}

const MAX_HISTORY = 14;

function weekDates(todayKey: string): string[] {
  const keys: string[] = [];
  const today = new Date(`${todayKey}T12:00:00`);
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(date.getDate() - offset);
    keys.push(toDateKey(date));
  }
  return keys;
}

function parseHistoryEntry(raw: unknown): HomeCheckInDay | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const date = typeof record.date === 'string' ? record.date : '';
  const value = record.value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  if (value !== 'up' && value !== 'down') return null;
  return { date, value };
}

export function checkInHistoryFromMetadata(
  meta: Record<string, unknown> | undefined
): HomeCheckInDay[] {
  const byDate = new Map<string, HomeCheckInValue>();

  const rawHistory = meta?.home_check_in_history;
  if (Array.isArray(rawHistory)) {
    for (const entry of rawHistory) {
      const day = parseHistoryEntry(entry);
      if (day) byDate.set(day.date, day.value);
    }
  }

  const single = meta?.home_check_in_day;
  const dayField = parseHistoryEntry(single);
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
  const existing = checkInHistoryFromMetadata(meta).filter((day) => day.date !== date);
  return [{ date, value }, ...existing]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, MAX_HISTORY);
}

export function buildCheckInWeek(
  meta: Record<string, unknown> | undefined,
  todayKey = toDateKey(new Date())
): CheckInWeekDay[] {
  const byDate = new Map(checkInHistoryFromMetadata(meta).map((day) => [day.date, day.value]));
  return weekDates(todayKey).map((date) => ({
    date,
    value: byDate.get(date) ?? null,
  }));
}

export function weekHasCheckIns(week: CheckInWeekDay[]): boolean {
  return week.some((day) => day.value !== null);
}
