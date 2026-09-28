import { toDateKey } from '@/lib/dateKey';

export interface GentlePresence {
  daysThisWeek: number;
  /** ISO date keys (YYYY-MM-DD) in the rolling 7-day window that had activity. */
  activeDays: string[];
}

function uniqueDateKeys(values: string[]): string[] {
  return [...new Set(values.filter((key) => /^\d{4}-\d{2}-\d{2}$/.test(key)))];
}

function datesFromTimestamps(values: Array<string | null | undefined>): string[] {
  const keys: string[] = [];
  for (const value of values) {
    if (!value) continue;
    const key = toDateKey(new Date(value));
    if (key) keys.push(key);
  }
  return keys;
}

function weekWindow(todayKey: string): string[] {
  const keys: string[] = [];
  const today = new Date(`${todayKey}T12:00:00`);
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(date.getDate() - offset);
    keys.push(toDateKey(date));
  }
  return keys;
}

export function buildGentlePresence({
  diaryEntryDates,
  sessionTimestamps,
  journeyTimestamps,
  extraDates = [],
  todayKey = toDateKey(new Date()),
}: {
  diaryEntryDates: string[];
  sessionTimestamps: Array<string | null | undefined>;
  journeyTimestamps: Array<string | null | undefined>;
  extraDates?: string[];
  todayKey?: string;
}): GentlePresence {
  const window = weekWindow(todayKey);
  const windowSet = new Set(window);

  const allDays = uniqueDateKeys([
    ...diaryEntryDates,
    ...datesFromTimestamps(sessionTimestamps),
    ...datesFromTimestamps(journeyTimestamps),
    ...extraDates,
  ]).filter((key) => windowSet.has(key));

  return {
    daysThisWeek: allDays.length,
    activeDays: allDays.sort(),
  };
}

export function gentlePresenceMessage(daysThisWeek: number): string | null {
  if (daysThisWeek <= 0) return null;
  if (daysThisWeek === 1) return 'You showed up 1 day this week.';
  return `You showed up ${daysThisWeek} days this week.`;
}
