import type { TutorialStep } from '@/lib/home';

const DONE_KEY_PREFIX = 'qhrt-starting-out-done:';

export interface StartingOutStep {
  id: string;
  title: string;
  paragraphs: string[];
  points?: string[];
}

export const STARTING_OUT_STEPS: StartingOutStep[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    paragraphs: [
      'This guide explains what QHRT is, why it works, and what you can expect in a session.',
    ],
  },
  {
    id: 'stress',
    title: 'Why stress lives in the body',
    paragraphs: ['Stress turns on your body’s fight or flight system.'],
    points: [
      'Over time, stress can stay in muscles and organs.',
      'QHRT helps your body let go of these stored patterns.',
    ],
  },
  {
    id: 'breath',
    title: 'How breathwork helps',
    paragraphs: [
      'Breathing slowly and with intention calms your nervous system, eases tension, and helps your body feel safe.',
      'You will learn a simple pattern.',
    ],
    points: ['Inhale for 3 counts.', 'Exhale for 5 counts.'],
  },
  {
    id: 'sensations',
    title: 'Understanding somatic sensations',
    paragraphs: [
      'During QHRT, you may notice tightness, heat, pressure, tingling, or movement.',
      'These sensations are normal and part of the release process.',
    ],
  },
  {
    id: 'sud',
    title: 'The SUD scale',
    paragraphs: ['You rate sensations from 1 to 10. This helps track your progress.'],
    points: ['1 is very mild.', '10 is very intense.'],
  },
  {
    id: 'emotions',
    title: 'Archetypal emotions',
    paragraphs: ['Your guide may say a word like one of these. The words help your body reach stored emotional patterns.'],
    points: ['Blame', 'Shame', 'Fear', 'Abandonment'],
  },
  {
    id: 'session',
    title: 'What happens in a session',
    paragraphs: ['You stay in full control the entire time.'],
    points: [
      'Breathe in a steady rhythm.',
      'Gently engage your core.',
      'Focus on your guide’s voice.',
      'Scan your body.',
      'Notice sensations.',
      'Allow them to shift and release.',
    ],
  },
  {
    id: 'after',
    title: 'After your session',
    paragraphs: ['You may feel lighter, calmer, tired, or more aware of your body. These are normal signs of release.'],
  },
  {
    id: 'between',
    title: 'Between sessions',
    paragraphs: ['You will practice a few things that help the work settle.'],
    points: ['Breathwork', 'Somatic noticing', 'Journaling'],
  },
];

export function readStartingOutDone(userId?: string): boolean {
  if (!userId || typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(`${DONE_KEY_PREFIX}${userId}`) === '1';
  } catch {
    return false;
  }
}

export function writeStartingOutDone(userId: string) {
  try {
    localStorage.setItem(`${DONE_KEY_PREFIX}${userId}`, '1');
  } catch {
    // Ignore.
  }
}

/** Marks the guide finished and picks the next current step. */
export function withStartingOutStatus(steps: TutorialStep[], done: boolean): TutorialStep[] {
  if (!done || !steps.some((step) => step.id === 'starting-out')) return steps;
  const complete = new Set(steps.filter((step) => step.status === 'complete').map((step) => step.id));
  complete.add('starting-out');
  let currentAssigned = false;
  return steps.map((step) => {
    if (complete.has(step.id)) return { ...step, status: 'complete' };
    if (!currentAssigned) {
      currentAssigned = true;
      return { ...step, status: 'current' };
    }
    return { ...step, status: 'upcoming' };
  });
}
