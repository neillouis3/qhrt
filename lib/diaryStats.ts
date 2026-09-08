import { parseDateKey, toDateKey } from '@/lib/dateKey';
import { DIARY_MOODS, type DiaryMood } from '@/lib/types/diary';

export interface DiaryDayStat {
  date: string;
  weekday: string;
  mood: DiaryMood | null;
  hasEntry: boolean;
}

export interface HomeDiaryStats {
  totalEntries: number;
  entriesThisWeek: number;
  streakDays: number;
  week: DiaryDayStat[];
  averageMoodThisWeek: number | null;
  todayMood: DiaryMood | null;
  todayHasEntry: boolean;
}

interface DiaryStatRow {
  entry_date: string;
  mood: number | null;
  created_at: string;
}

function addDays(key: string, amount: number): string {
  const date = parseDateKey(key);
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
}

function weekdayShort(key: string): string {
  return parseDateKey(key).toLocaleDateString(undefined, { weekday: 'short' });
}

function moodByDay(entries: DiaryStatRow[]): Map<string, DiaryMood | null> {
  const sorted = [...entries].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const map = new Map<string, DiaryMood | null>();
  for (const entry of sorted) {
    const key = toDateKey(entry.entry_date);
    if (!key || map.has(key)) continue;
    map.set(key, entry.mood as DiaryMood | null);
  }
  return map;
}

function computeStreak(entryDates: Set<string>, todayKey: string): number {
  let cursor = todayKey;
  if (!entryDates.has(cursor)) {
    cursor = addDays(cursor, -1);
  }

  let streak = 0;
  while (entryDates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function buildHomeDiaryStats(entries: DiaryStatRow[]): HomeDiaryStats {
  const todayKey = toDateKey(new Date());
  const moods = moodByDay(entries);
  const entryDates = new Set(moods.keys());

  const week: DiaryDayStat[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = addDays(todayKey, -offset);
    week.push({
      date,
      weekday: weekdayShort(date),
      mood: moods.get(date) ?? null,
      hasEntry: entryDates.has(date),
    });
  }

  const weekStart = week[0]?.date ?? todayKey;
  const entriesThisWeek = [...entryDates].filter((date) => date >= weekStart && date <= todayKey).length;

  const moodValues = week.map((day) => day.mood).filter((mood): mood is DiaryMood => mood != null);
  const averageMoodThisWeek =
    moodValues.length > 0
      ? Math.round((moodValues.reduce((sum, mood) => sum + mood, 0) / moodValues.length) * 10) / 10
      : null;

  return {
    totalEntries: entries.length,
    entriesThisWeek,
    streakDays: computeStreak(entryDates, todayKey),
    week,
    averageMoodThisWeek,
    todayMood: moods.get(todayKey) ?? null,
    todayHasEntry: entryDates.has(todayKey),
  };
}

export function averageMoodLabel(value: number | null): string | null {
  if (value == null) return null;
  const rounded = Math.round(value) as DiaryMood;
  return DIARY_MOODS.find((item) => item.value === rounded)?.label ?? null;
}

export function moodLabel(mood: DiaryMood | null): string | null {
  if (mood == null) return null;
  return DIARY_MOODS.find((item) => item.value === mood)?.label ?? null;
}
