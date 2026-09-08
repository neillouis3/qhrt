export type DiaryMood = 1 | 2 | 3 | 4 | 5;

export interface DiaryEntry {
  id: string;
  user_id: string;
  entry_date: string;
  title: string | null;
  body: string;
  mood: DiaryMood | null;
  created_at: string;
  updated_at: string;
}

export type DiaryCompletionKind = 'assessment' | 'conversation' | 'journey';

export interface DiaryCompletion {
  id: string;
  kind: DiaryCompletionKind;
  title: string;
  at: string;
}

export const DIARY_MOODS: { value: DiaryMood; label: string }[] = [
  { value: 1, label: 'Heavy' },
  { value: 2, label: 'Low' },
  { value: 3, label: 'Steady' },
  { value: 4, label: 'Light' },
  { value: 5, label: 'Bright' },
];
