import type { DiaryMood } from '@/lib/types/diary';

function clip(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function parseEntryDate(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return value;
}

function parseMood(value: unknown): DiaryMood | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 5) return null;
  return n as DiaryMood;
}

export function parseDiaryPayload(body: unknown):
  | {
      entryDate: string;
      title: string | null;
      body: string;
      mood: DiaryMood | null;
    }
  | { error: string } {
  const payload = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const entryDate = parseEntryDate(payload.entryDate);
  if (!entryDate) return { error: 'Choose a valid date' };
  const note = clip(payload.body, 4000);
  if (!note) return { error: 'Write a note before saving' };
  const title = clip(payload.title, 80) || null;
  const moodRaw = payload.mood;
  if (moodRaw != null && moodRaw !== '' && parseMood(moodRaw) == null) {
    return { error: 'Mood must be between 1 and 5' };
  }
  return { entryDate, title, body: note, mood: parseMood(moodRaw) };
}
