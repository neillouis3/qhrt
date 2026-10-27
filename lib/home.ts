export type HomeNextKind = 'onboarding' | 'assessment' | 'practice';

export interface HomeNext {
  kind: HomeNextKind;
  title: string;
  description: string;
  cta: string;
  href: string;
}

export interface HomeAssessment {
  slug: string;
  title: string;
  description: string | null;
}

export interface HomeAssessmentActivity {
  id: string;
  slug: string;
  title: string;
  created_at: string;
}

export type HomeActivityKind = 'assessment';

export interface HomeActivityItem {
  id: string;
  kind: HomeActivityKind;
  title: string;
  detail: string;
  status: string;
  href: string;
}

export type TutorialStepId = 'onboarding' | 'assessment' | 'diary';
export type TutorialStepStatus = 'complete' | 'current' | 'upcoming';

export interface TutorialStep {
  id: TutorialStepId;
  title: string;
  description: string;
  href: string;
  status: TutorialStepStatus;
}

function activityAt(value: string | null | undefined, fallback: string): number {
  const ts = Date.parse(value || fallback);
  return Number.isNaN(ts) ? 0 : ts;
}

export function pickHomeNext({
  intakeCompleted,
  nextAssessment,
  practiceTime,
}: {
  intakeCompleted: boolean;
  nextAssessment: HomeAssessment | null;
  practiceTime?: string | null;
}): HomeNext {
  if (!intakeCompleted) {
    return {
      kind: 'onboarding',
      title: 'Choose your focus',
      description: 'Tell us what you want to work on so we can suggest workbooks. You can skip any time.',
      cta: 'Continue',
      href: '/onboarding',
    };
  }

  if (nextAssessment) {
    return {
      kind: 'assessment',
      title: nextAssessment.title,
      description:
        nextAssessment.description ?? 'A short self-check that points you to a matching workbook.',
      cta: 'Start',
      href: `/assessments/${nextAssessment.slug}`,
    };
  }

  return idlePracticeNext(practiceTime);
}

export function idlePracticeNext(practiceTime?: string | null): HomeNext {
  if (practiceTime === 'morning') {
    return {
      kind: 'practice',
      title: 'A line for this morning',
      description: 'Write one note in the diary before the day gets loud.',
      cta: 'Diary',
      href: '/diary',
    };
  }
  if (practiceTime === 'afternoon') {
    return {
      kind: 'practice',
      title: 'Explore a focus area',
      description: 'Choose a topic and work through a standard coaching workbook at your pace.',
      cta: 'Focus areas',
      href: '/assessments',
    };
  }
  return {
    kind: 'practice',
    title: 'A few minutes to settle',
    description: 'Breathe with a simple inhale and exhale. No program, no questions.',
    cta: 'Breathe',
    href: '/breathe',
  };
}

export function buildHomeActivity({
  submissions,
  excludeHref,
  limit = 5,
}: {
  submissions: HomeAssessmentActivity[];
  excludeHref?: string | null;
  limit?: number;
}): HomeActivityItem[] {
  const rows: Array<HomeActivityItem & { at: number }> = [];

  for (const row of submissions) {
    const href = `/assessments/${row.slug}`;
    if (excludeHref && href === excludeHref) continue;
    rows.push({
      id: row.id,
      kind: 'assessment',
      title: row.title,
      detail: new Date(row.created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
      status: 'completed',
      href,
      at: activityAt(row.created_at, row.created_at),
    });
  }

  return rows
    .sort((a, b) => b.at - a.at)
    .slice(0, limit)
    .map(({ at: _at, ...item }) => item);
}

const TUTORIAL_STEPS: Array<{
  id: TutorialStepId;
  title: string;
  description: string;
  defaultHref: string;
}> = [
  {
    id: 'onboarding',
    title: 'Onboarding',
    description: 'Help us get to know you.',
    defaultHref: '/onboarding',
  },
  {
    id: 'assessment',
    title: 'Take a self-check',
    description: 'Answer a few questions in a focus area to get matching workbooks.',
    defaultHref: '/assessments',
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
  diaryCount,
}: {
  intakeCompleted: boolean;
  assessmentsCompleted: number;
  diaryCount: number;
}): TutorialStep[] {
  const done = {
    onboarding: intakeCompleted,
    assessment: assessmentsCompleted > 0,
    diary: diaryCount > 0,
  };

  let currentAssigned = false;
  return TUTORIAL_STEPS.map((def) => {
    let status: TutorialStepStatus;
    if (done[def.id]) {
      status = 'complete';
    } else if (!currentAssigned) {
      status = 'current';
      currentAssigned = true;
    } else {
      status = 'upcoming';
    }
    return { id: def.id, title: def.title, description: def.description, href: def.defaultHref, status };
  });
}
