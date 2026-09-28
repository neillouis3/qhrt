import { toDateKey } from '@/lib/dateKey';
import type { NameSource } from '@/lib/userName';

export type HomeCheckInValue = 'up' | 'down';

export interface HomeCheckInDay {
  date: string;
  value: HomeCheckInValue;
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

export function isHomeCheckInValue(value: unknown): value is HomeCheckInValue {
  return value === 'up' || value === 'down';
}
