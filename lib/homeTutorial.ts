import type { HomeJourney } from '@/lib/homeNext';

export type TutorialStepId = 'onboarding' | 'assessment' | 'journey' | 'diary';

export type TutorialStepStatus = 'complete' | 'current' | 'upcoming';

export interface TutorialStep {
  id: TutorialStepId;
  title: string;
  description: string;
  href: string;
  status: TutorialStepStatus;
}

const STEP_DEFS: Array<{
  id: TutorialStepId;
  title: string;
  description: string;
  defaultHref: string;
}> = [
  {
    id: 'onboarding',
    title: 'Set your focus',
    description: 'Share what you want to learn — we suggest standard workbooks, not treatment.',
    defaultHref: '/onboarding',
  },
  {
    id: 'assessment',
    title: 'Take a self-check',
    description: 'Answer a few questions in a focus area to get matching workbooks.',
    defaultHref: '/assessments',
  },
  {
    id: 'journey',
    title: 'Start a journey',
    description: 'A multi-phase program when you are ready to go deeper.',
    defaultHref: '/journeys',
  },
  {
    id: 'diary',
    title: 'Write in your diary',
    description: 'A line about how today is going.',
    defaultHref: '/diary',
  },
];

export function buildHomeTutorial({
  intakeCompleted,
  assessmentsCompleted,
  journeys,
  diaryCount,
}: {
  intakeCompleted: boolean;
  assessmentsCompleted: number;
  journeys: HomeJourney[];
  diaryCount: number;
}): TutorialStep[] {
  const done = {
    onboarding: intakeCompleted,
    assessment: assessmentsCompleted > 0,
    journey: journeys.length > 0,
    diary: diaryCount > 0,
  };

  let currentAssigned = false;
  const steps: TutorialStep[] = STEP_DEFS.map((def) => {
    let status: TutorialStepStatus;
    if (done[def.id]) {
      status = 'complete';
    } else if (!currentAssigned) {
      status = 'current';
      currentAssigned = true;
    } else {
      status = 'upcoming';
    }

    let href = def.defaultHref;
    if (def.id === 'journey' && journeys.length > 0) {
      const latest = [...journeys].sort((a, b) => {
        const aAt = a.updated_at ?? a.created_at;
        const bAt = b.updated_at ?? b.created_at;
        return bAt.localeCompare(aAt);
      })[0];
      if (latest) href = `/journeys/${latest.id}`;
    }

    return {
      id: def.id,
      title: def.title,
      description: def.description,
      href,
      status,
    };
  });

  return steps;
}

export function tutorialComplete(steps: TutorialStep[]): boolean {
  return steps.length > 0 && steps.every((step) => step.status === 'complete');
}

export function currentTutorialStep(steps: TutorialStep[]): TutorialStep | null {
  return steps.find((step) => step.status === 'current') ?? null;
}
