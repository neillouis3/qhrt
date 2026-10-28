export const PRACTICE_CATALOG = [
  {
    id: 'breathe',
    title: 'Breathe',
    href: '/breathe',
    cue: 'Inhale and exhale with a slow visual guide.',
    art: 'breathe',
  },
  {
    id: 'settle',
    title: 'Settle',
    href: '/wind-down/settle',
    cue: 'A countdown that walks you into stillness.',
    art: 'settle',
  },
  {
    id: 'grounding',
    title: 'Grounding',
    href: '/wind-down/grounding',
    cue: 'Name 5 things you can see, 4 things you can feel, 3 things you can hear, 2 things you can smell, and 1 thing you can taste.',
    art: 'grounding',
  },
  {
    id: 'muscles',
    title: 'Muscles',
    href: '/wind-down/muscles',
    cue: 'Tense, then release. The count will lead.',
    art: 'muscles',
  },
] as const;

export type PracticeId = (typeof PRACTICE_CATALOG)[number]['id'];
export type PracticeArt = (typeof PRACTICE_CATALOG)[number]['art'];

export const PRACTICE_DONE = 'done';

export function isPracticeId(value: string | null | undefined): value is PracticeId {
  return PRACTICE_CATALOG.some((practice) => practice.id === value);
}

export function practiceById(id: string | null | undefined) {
  return PRACTICE_CATALOG.find((practice) => practice.id === id) ?? null;
}
