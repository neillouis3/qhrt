export type HomeNextKind =
  | 'onboarding'
  | 'resume-session'
  | 'resume-journey'
  | 'assessment'
  | 'practice';

export interface HomeNext {
  kind: HomeNextKind;
  title: string;
  description: string;
  cta: string;
  href: string;
}

export interface HomeConversation {
  id: string;
  status: string;
  knowledge_model_id: string;
  knowledge_model_name: string;
  started_at: string;
  updated_at?: string | null;
}

export interface HomeJourney {
  id: string;
  status: string;
  current_phase_order: number;
  created_at: string;
  updated_at?: string | null;
  domain_name?: string | null;
}

export interface HomeAssessment {
  slug: string;
  title: string;
  description: string | null;
}

function isOpen(status: string): boolean {
  return status !== 'completed';
}

function activityAt(value: string | null | undefined, fallback: string): number {
  const ts = Date.parse(value || fallback);
  return Number.isNaN(ts) ? 0 : ts;
}

export function displaySessionName(name: string): string {
  return name.replace(/\s+assessment$/i, '').trim() || name;
}

export function pickHomeNext({
  intakeCompleted,
  conversations,
  journeys,
  nextAssessment,
  practiceTime,
}: {
  intakeCompleted: boolean;
  conversations: HomeConversation[];
  journeys: HomeJourney[];
  /** First active assessment the user hasn't completed yet. */
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

  const openConversations = conversations.filter((c) => isOpen(c.status));
  const openJourneys = journeys.filter((j) => isOpen(j.status));

  let latestConversation: HomeConversation | null = null;
  let latestConversationAt = 0;
  for (const conv of openConversations) {
    const at = activityAt(conv.updated_at, conv.started_at);
    if (at >= latestConversationAt) {
      latestConversation = conv;
      latestConversationAt = at;
    }
  }

  let latestJourney: HomeJourney | null = null;
  let latestJourneyAt = 0;
  for (const journey of openJourneys) {
    const at = activityAt(journey.updated_at, journey.created_at);
    if (at >= latestJourneyAt) {
      latestJourney = journey;
      latestJourneyAt = at;
    }
  }

  if (latestConversation && latestConversationAt >= latestJourneyAt) {
    const name = displaySessionName(latestConversation.knowledge_model_name);
    return {
      kind: 'resume-session',
      title: `Continue ${name}`,
      description: 'Your workbook is saved. Continue the guided prompts when you are ready.',
      cta: 'Resume',
      href: `/sessions/${latestConversation.id}`,
    };
  }

  if (latestJourney) {
    const domain = latestJourney.domain_name?.trim();
    return {
      kind: 'resume-journey',
      title: domain ? `Continue ${domain}` : 'Continue your journey',
      description: `Phase ${latestJourney.current_phase_order} is waiting.`,
      cta: 'Resume',
      href: `/journeys/${latestJourney.id}`,
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
