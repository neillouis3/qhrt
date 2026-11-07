/**
 * Program Readiness pathway scoring.
 * Hybrid Rule-Based + Domain-Scoring Model v1.0 (November 1, 2026).
 *
 * A total score never chooses the pathway by itself. Immediate override,
 * the critical gate, and domain pattern are applied before the overall score.
 * Percentages keep full precision. Missing answers are never treated as zero.
 */

export const QUESTIONNAIRE_VERSION = '1.0';
export const SCORING_RULE_VERSION = '1.0';
export const SCORING_EFFECTIVE_DATE = '2026-11-01';

export const DOMAIN_READY_THRESHOLD = 80;
export const DOMAIN_PREPARATION_THRESHOLD = 60;
export const OVERALL_SELF_DIRECTED_THRESHOLD = 80;
export const OVERALL_PREPARATION_THRESHOLD = 60;
export const CRITICAL_MINIMUM_SCORE = 2;
export const OVERALL_MAX_POINTS = 78;
export const SCORED_QUESTION_COUNT = 26;

export type PathwayCode =
  | 'SELF_DIRECTED_READY'
  | 'PREPARATION_READINESS'
  | 'ADDITIONAL_TIME_SUPPORT'
  | 'PRACTICAL_PREPARATION'
  | 'IMMEDIATE_OUTSIDE_ASSISTANCE';

export type AppPathwayKey = 'self_directed' | 'preparation' | 'additional_time' | 'practical' | 'immediate';

export type DomainClassification =
  | 'DOMAIN_READY'
  | 'DOMAIN_PREPARATION'
  | 'DOMAIN_NOT_READY_YET'
  | 'DOMAIN_PRACTICAL_BARRIER';

export type OverallClassification =
  | 'STRONG_OVERALL_READINESS'
  | 'PREPARATION_RANGE'
  | 'ADDITIONAL_TIME_SUPPORT_RANGE';

export type AssessmentStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'PAUSED'
  | 'COMPLETED'
  | 'EXITED_IMMEDIATE_ASSISTANCE'
  | 'INCOMPLETE';

export type PreparationActivity = {
  title: string;
  items: string[];
};

type Scale = 'immediate' | 'readiness' | 'suitability';

export type QuestionConfig = {
  id: string;
  storageKey: string;
  questionText: string;
  section: 'safety' | 'independence' | 'suitability';
  displayOrder: number;
  responseSet: string;
  required: boolean;
  critical: boolean;
  domains: number[];
  scale: Scale;
  active: boolean;
  questionnaireVersion: string;
};

export type DomainScore = {
  index: number;
  points: number | null;
  maximum: number;
  percentage: number | null;
  classification: DomainClassification | null;
};

export type ResponseRecord = {
  questionId: string;
  questionCode: string;
  questionText: string;
  responseValue: string;
  numericScore: number | null;
  required: boolean;
  critical: boolean;
  domainMembership: number[];
};

export type PathwayMetrics = {
  preparationFlag: boolean;
  s16: number;
  criticalZeroCount: number;
  criticalOneCount: number;
  criticalGatePassed: boolean;
  domains: DomainClassification[];
  overall: number;
};

export type ReadinessScore = {
  status: 'INCOMPLETE' | 'COMPLETED' | 'EXITED_IMMEDIATE_ASSISTANCE';
  pathway: PathwayCode | null;
  appPathway: AppPathwayKey | null;
  trigger: string | null;
  questionnaireVersion: string;
  scoringRuleVersion: string;
  immediateOverride: boolean;
  preparationFlag: boolean | null;
  criticalZeroCount: number | null;
  criticalOneCount: number | null;
  criticalGatePassed: boolean | null;
  domains: DomainScore[];
  overallScore: number | null;
  overallPoints: number | null;
  reassessmentRequired: boolean;
  responses: ResponseRecord[];
};

const READINESS_SCORES: Record<string, number> = {
  yes: 3,
  mostly: 2,
  sometimes: 1,
  not_yet: 0,
};

const SUITABILITY_SCORES: Record<string, number> = {
  yes: 3,
  mostly: 2,
  unsure: 1,
  not_right_now: 0,
};

const IMMEDIATE_YES_NO = ['yes', 'no'];
const IMMEDIATE_YES_NO_UNSURE = ['yes', 'no', 'unsure'];

function question(
  id: string,
  storageKey: string,
  section: QuestionConfig['section'],
  displayOrder: number,
  questionText: string,
  responseSet: string,
  scale: Scale,
  critical: boolean,
  domains: number[]
): QuestionConfig {
  return {
    id,
    storageKey,
    questionText,
    section,
    displayOrder,
    responseSet,
    required: true,
    critical,
    domains,
    scale,
    active: true,
    questionnaireVersion: QUESTIONNAIRE_VERSION,
  };
}

export const QUESTIONS: QuestionConfig[] = [
  question('IR1', 's1', 'safety', 1, 'Are you currently in immediate danger or unable to keep yourself safe?', 'immediate_yes_no', 'immediate', false, []),
  question('IR2', 's2', 'safety', 2, 'Are you currently considering acting on thoughts of suicide, self-harm or seriously harming someone else?', 'immediate_yes_no', 'immediate', false, []),
  question('IR3', 's3', 'safety', 3, 'Are you currently experiencing severe confusion, disorientation, loss of contact with your surroundings or difficulty reliably caring for yourself?', 'immediate_yes_no', 'immediate', false, []),
  question('IR4', 's4', 'safety', 4, 'Are you currently experiencing an urgent or emergency situation that requires immediate outside assistance?', 'immediate_yes_no', 'immediate', false, []),
  question('IR5', 's5', 'safety', 5, 'Are you currently so overwhelmed that reflective or self-directed wellness activities feel unmanageable?', 'immediate_yes_no_unsure', 'immediate', false, []),
  question('R1', 'i1', 'independence', 6, 'I can usually recognize when an activity is beginning to feel like too much for me.', 'readiness_scale', 'readiness', true, [1]),
  question('R2', 'i2', 'independence', 7, 'I can stop or pause an activity rather than feeling that I have to push myself to continue.', 'readiness_scale', 'readiness', true, [1]),
  question('R3', 'i3', 'independence', 8, 'I have simple ways of helping myself return my attention to the present moment when I need to.', 'readiness_scale', 'readiness', false, [3]),
  question('R4', 'i4', 'independence', 9, 'I can notice thoughts, feelings and physical sensations without feeling that I must immediately react to them.', 'readiness_scale', 'readiness', false, [3]),
  question('R5', 'i5', 'independence', 10, 'I am comfortable following instructions and completing activities independently.', 'readiness_scale', 'readiness', true, [2]),
  question('R6', 'i6', 'independence', 11, 'I know who or what I can turn to when I want encouragement, assistance or additional personal support.', 'readiness_scale', 'readiness', false, [5]),
  question('R7', 'i7', 'independence', 12, 'I am willing to seek additional outside support if something feels beyond what I want to manage independently.', 'readiness_scale', 'readiness', false, [5]),
  question('R8', 'i8', 'independence', 13, 'I have access to a reasonably private and comfortable place where I can participate without unnecessary interruption.', 'readiness_scale', 'readiness', false, [6]),
  question('R9', 'i9', 'independence', 14, 'I can give myself enough time to complete activities without feeling rushed.', 'readiness_scale', 'readiness', false, [6]),
  question('R10', 'i10', 'independence', 15, 'I understand that I can pause, stop or return to the program at any time.', 'readiness_scale', 'readiness', true, [1]),
  question('S1', 'u1', 'suitability', 16, 'I am comfortable taking time to reflect on my experiences, responses, habits and personal patterns.', 'suitability_scale', 'suitability', false, [3]),
  question('S2', 'u2', 'suitability', 17, 'I am comfortable paying attention to what I notice within myself during an activity, including thoughts, feelings and physical sensations.', 'suitability_scale', 'suitability', false, [3]),
  question('S3', 'u3', 'suitability', 18, 'I understand that personal reflection may occasionally bring strong or uncomfortable thoughts, feelings, memories or physical sensations into my awareness.', 'suitability_scale', 'suitability', false, [3, 4]),
  question('S4', 'u4', 'suitability', 19, 'I am willing to allow each activity to unfold naturally without trying to force myself to remember, feel, understand or experience something specific.', 'suitability_scale', 'suitability', false, [3, 4]),
  question('S5', 'u5', 'suitability', 20, 'I am comfortable deciding for myself when to continue, pause, stop or return to an activity later.', 'suitability_scale', 'suitability', true, [1]),
  question('S6', 'u6', 'suitability', 21, 'I am comfortable following instructions and completing activities independently in a self-paced online program.', 'suitability_scale', 'suitability', true, [2]),
  question('S7', 'u7', 'suitability', 22, 'I am willing to move through the program at a pace that feels manageable and appropriate for me rather than rushing to complete it.', 'suitability_scale', 'suitability', false, [1]),
  question('S8', 'u8', 'suitability', 23, 'If an activity begins to feel like too much for me at that moment, I am willing to pause, reset and return later rather than pushing myself to continue.', 'suitability_scale', 'suitability', true, [1]),
  question('S9', 'u9', 'suitability', 24, 'I am willing to notice how I am responding to the program and make choices about my participation based on what feels appropriate for me.', 'suitability_scale', 'suitability', false, [2, 3]),
  question('S10', 'u10', 'suitability', 25, 'I understand that people may experience the QHRT program differently and that individual experiences and outcomes will vary.', 'suitability_scale', 'suitability', false, [4]),
  question('S11', 'u11', 'suitability', 26, 'I understand that QHRT is an educational and instructional wellness program designed to support personal well-being and quality of life.', 'suitability_scale', 'suitability', false, [4]),
  question('S12', 'u12', 'suitability', 27, 'I understand that I remain responsible for deciding whether, when and how I participate in the program.', 'suitability_scale', 'suitability', true, [1, 4]),
  question('S13', 'u13', 'suitability', 28, 'I have people, activities, routines or other personal resources I can turn to when I want additional encouragement or assistance.', 'suitability_scale', 'suitability', false, [5]),
  question('S14', 'u14', 'suitability', 29, 'I have access to a reasonably private and comfortable environment where I can participate without unnecessary interruption.', 'suitability_scale', 'suitability', false, [6]),
  question('S15', 'u15', 'suitability', 30, 'I can give myself enough time and attention to complete activities without feeling rushed.', 'suitability_scale', 'suitability', false, [6]),
  question('S16', 'u16', 'suitability', 31, 'I am choosing to participate in QHRT voluntarily and because the program feels personally relevant to me.', 'suitability_scale', 'suitability', true, [2]),
];

const QUESTIONS_BY_ID = new Map(QUESTIONS.map((item) => [item.id, item]));

export const DOMAIN_QUESTIONS: Record<number, { ids: string[]; maximum: number; practical: boolean }> = {
  1: { ids: ['R1', 'R2', 'R10', 'S5', 'S7', 'S8', 'S12'], maximum: 21, practical: false },
  2: { ids: ['R5', 'S6', 'S9', 'S16'], maximum: 12, practical: false },
  3: { ids: ['R3', 'R4', 'S1', 'S2', 'S3', 'S4', 'S9'], maximum: 21, practical: false },
  4: { ids: ['S3', 'S4', 'S10', 'S11', 'S12'], maximum: 15, practical: false },
  5: { ids: ['R6', 'R7', 'S13'], maximum: 9, practical: false },
  6: { ids: ['R8', 'R9', 'S14', 'S15'], maximum: 12, practical: true },
};

const PREPARATION_ACTIVITIES: Record<number, PreparationActivity> = {
  1: {
    title: 'Pause, Pace & Personal Choice',
    items: [
      'recognizing when to pause',
      'allowing yourself to stop',
      'moving at your own pace',
      'making participation choices',
    ],
  },
  2: {
    title: 'Independent Participation',
    items: [
      'becoming familiar with the QHRT program format',
      'practicing short self-directed activities',
      'increasing readiness for independent participation',
    ],
  },
  3: {
    title: 'Personal Awareness & Reflection',
    items: [
      'noticing present experiences',
      'short reflection activities',
      'becoming familiar with observing thoughts, feelings and physical sensations',
    ],
  },
  4: {
    title: 'Program Understanding & Expectations',
    items: [
      'QHRT orientation',
      'explanation of program activities',
      'how sessions work',
      'what to expect',
      'how to pause and return',
    ],
  },
  5: {
    title: 'Personal Resources',
    items: [
      'identifying helpful people',
      'identifying helpful routines',
      'identifying helpful activities',
      'creating a personal resources list',
    ],
  },
  6: {
    title: 'Practical Readiness',
    items: [
      'choosing an appropriate time',
      'preparing a comfortable space',
      'reducing interruptions',
      'allowing enough time',
    ],
  },
};

const EMPTY_DOMAINS: DomainScore[] = [1, 2, 3, 4, 5, 6].map((index) => ({
  index,
  points: null,
  maximum: DOMAIN_QUESTIONS[index]!.maximum,
  percentage: null,
  classification: null,
}));

function allowedValues(item: QuestionConfig): string[] {
  if (item.id === 'IR5') return IMMEDIATE_YES_NO_UNSURE;
  if (item.scale === 'immediate') return IMMEDIATE_YES_NO;
  if (item.scale === 'readiness') return Object.keys(READINESS_SCORES);
  return Object.keys(SUITABILITY_SCORES);
}

function readValue(answers: Record<string, string>, item: QuestionConfig): string | null {
  const raw = answers[item.id] ?? answers[item.storageKey];
  if (typeof raw !== 'string') return null;
  const value = raw.trim().toLowerCase();
  if (!value || !allowedValues(item).includes(value)) return null;
  return value;
}

function numericScore(item: QuestionConfig, value: string): number | null {
  if (item.scale === 'immediate') return null;
  const table = item.scale === 'readiness' ? READINESS_SCORES : SUITABILITY_SCORES;
  return table[value] ?? null;
}

export function appPathwayKey(pathway: PathwayCode): AppPathwayKey {
  switch (pathway) {
    case 'SELF_DIRECTED_READY':
      return 'self_directed';
    case 'PREPARATION_READINESS':
      return 'preparation';
    case 'ADDITIONAL_TIME_SUPPORT':
      return 'additional_time';
    case 'PRACTICAL_PREPARATION':
      return 'practical';
    case 'IMMEDIATE_OUTSIDE_ASSISTANCE':
      return 'immediate';
  }
}

export function domainPercentage(points: number, maximum: number): number {
  return (points / maximum) * 100;
}

export function classifyDomain(percentage: number, domain: number): DomainClassification {
  if (percentage >= DOMAIN_READY_THRESHOLD) return 'DOMAIN_READY';
  if (percentage >= DOMAIN_PREPARATION_THRESHOLD) return 'DOMAIN_PREPARATION';
  return domain === 6 ? 'DOMAIN_PRACTICAL_BARRIER' : 'DOMAIN_NOT_READY_YET';
}

export function classifyOverall(score: number): OverallClassification {
  if (score >= OVERALL_SELF_DIRECTED_THRESHOLD) return 'STRONG_OVERALL_READINESS';
  if (score >= OVERALL_PREPARATION_THRESHOLD) return 'PREPARATION_RANGE';
  return 'ADDITIONAL_TIME_SUPPORT_RANGE';
}

/** Final pathway priority from the published decision algorithm. */
export function assignPathway(metrics: PathwayMetrics): { pathway: PathwayCode; trigger: string } {
  if (metrics.s16 === 0) return { pathway: 'ADDITIONAL_TIME_SUPPORT', trigger: 'voluntary_participation' };
  if (metrics.criticalZeroCount >= 2) return { pathway: 'ADDITIONAL_TIME_SUPPORT', trigger: 'critical_zeros' };

  const opening = metrics.domains.slice(0, 5);
  const notReady = opening.filter((item) => item === 'DOMAIN_NOT_READY_YET').length;
  if (notReady >= 2) return { pathway: 'ADDITIONAL_TIME_SUPPORT', trigger: 'domains_not_ready' };
  if (metrics.overall < OVERALL_PREPARATION_THRESHOLD) {
    return { pathway: 'ADDITIONAL_TIME_SUPPORT', trigger: 'overall_below_60' };
  }

  const domain6 = metrics.domains[5];
  if (
    opening.every((item) => item === 'DOMAIN_READY') &&
    domain6 === 'DOMAIN_PRACTICAL_BARRIER' &&
    metrics.criticalGatePassed &&
    !metrics.preparationFlag
  ) {
    return { pathway: 'PRACTICAL_PREPARATION', trigger: 'practical_barrier' };
  }

  if (metrics.criticalZeroCount === 1) return { pathway: 'PREPARATION_READINESS', trigger: 'one_critical_zero' };
  if (metrics.criticalOneCount >= 1) return { pathway: 'PREPARATION_READINESS', trigger: 'critical_ones' };
  if (metrics.preparationFlag) return { pathway: 'PREPARATION_READINESS', trigger: 'preparation_flag' };
  if (notReady === 1) return { pathway: 'PREPARATION_READINESS', trigger: 'one_domain_not_ready' };
  if (metrics.domains.some((item) => item === 'DOMAIN_PREPARATION')) {
    return { pathway: 'PREPARATION_READINESS', trigger: 'domain_preparation' };
  }
  if (metrics.overall < OVERALL_SELF_DIRECTED_THRESHOLD) {
    return { pathway: 'PREPARATION_READINESS', trigger: 'overall_below_80' };
  }

  const readyCount = metrics.domains.filter((item) => item === 'DOMAIN_READY').length;
  if (
    metrics.criticalGatePassed &&
    metrics.overall >= OVERALL_SELF_DIRECTED_THRESHOLD &&
    readyCount >= 4 &&
    notReady === 0 &&
    domain6 !== 'DOMAIN_PRACTICAL_BARRIER' &&
    !metrics.preparationFlag
  ) {
    return { pathway: 'SELF_DIRECTED_READY', trigger: 'self_directed_ready' };
  }

  return { pathway: 'PREPARATION_READINESS', trigger: 'preparation_readiness' };
}

export function nextAssessmentSequence(existing: number[]): number {
  if (existing.length === 0) return 1;
  return Math.max(...existing) + 1;
}

function responseFor(item: QuestionConfig, value: string, score: number | null): ResponseRecord {
  return {
    questionId: item.id,
    questionCode: item.id,
    questionText: item.questionText,
    responseValue: value,
    numericScore: score,
    required: item.required,
    critical: item.critical,
    domainMembership: item.domains,
  };
}

function blank(status: ReadinessScore['status'], responses: ResponseRecord[]): ReadinessScore {
  return {
    status,
    pathway: status === 'EXITED_IMMEDIATE_ASSISTANCE' ? 'IMMEDIATE_OUTSIDE_ASSISTANCE' : null,
    appPathway: status === 'EXITED_IMMEDIATE_ASSISTANCE' ? 'immediate' : null,
    trigger: status === 'EXITED_IMMEDIATE_ASSISTANCE' ? 'immediate_override' : null,
    questionnaireVersion: QUESTIONNAIRE_VERSION,
    scoringRuleVersion: SCORING_RULE_VERSION,
    immediateOverride: status === 'EXITED_IMMEDIATE_ASSISTANCE',
    preparationFlag: null,
    criticalZeroCount: null,
    criticalOneCount: null,
    criticalGatePassed: null,
    domains: EMPTY_DOMAINS,
    overallScore: null,
    overallPoints: null,
    reassessmentRequired: false,
    responses,
  };
}

export function scoreReadiness(answers: Record<string, string>): ReadinessScore {
  const immediateIds = ['IR1', 'IR2', 'IR3', 'IR4'];
  const override = immediateIds.some((id) => {
    const item = QUESTIONS_BY_ID.get(id);
    return item ? readValue(answers, item) === 'yes' : false;
  });

  if (override) {
    const responses: ResponseRecord[] = [];
    for (const item of QUESTIONS) {
      if (item.scale !== 'immediate') continue;
      const value = readValue(answers, item);
      if (!value) continue;
      responses.push(responseFor(item, value, null));
    }
    return blank('EXITED_IMMEDIATE_ASSISTANCE', responses);
  }

  const values = new Map<string, string>();
  for (const item of QUESTIONS) {
    const value = readValue(answers, item);
    if (!value) return blank('INCOMPLETE', []);
    values.set(item.id, value);
  }

  const points = new Map<string, number>();
  const responses: ResponseRecord[] = [];
  let criticalZeroCount = 0;
  let criticalOneCount = 0;
  let overallPoints = 0;

  for (const item of QUESTIONS) {
    const value = values.get(item.id)!;
    const score = numericScore(item, value);
    responses.push(responseFor(item, value, score));
    if (score === null) continue;
    points.set(item.id, score);
    overallPoints += score;
    if (!item.critical) continue;
    if (score === 0) criticalZeroCount += 1;
    if (score === 1) criticalOneCount += 1;
  }

  const ir5 = values.get('IR5');
  const preparationFlag = ir5 === 'yes' || ir5 === 'unsure';
  const s16 = points.get('S16') ?? 0;
  const criticalGatePassed = criticalZeroCount === 0 && criticalOneCount === 0;

  const domains: DomainScore[] = [1, 2, 3, 4, 5, 6].map((index) => {
    const domain = DOMAIN_QUESTIONS[index]!;
    let earned = 0;
    for (const id of domain.ids) earned += points.get(id) ?? 0;
    const percentage = domainPercentage(earned, domain.maximum);
    return {
      index,
      points: earned,
      maximum: domain.maximum,
      percentage,
      classification: classifyDomain(percentage, index),
    };
  });

  const decision = assignPathway({
    preparationFlag,
    s16,
    criticalZeroCount,
    criticalOneCount,
    criticalGatePassed,
    domains: domains.map((domain) => domain.classification!),
    overall: domainPercentage(overallPoints, OVERALL_MAX_POINTS),
  });

  return {
    status: 'COMPLETED',
    pathway: decision.pathway,
    appPathway: appPathwayKey(decision.pathway),
    trigger: decision.trigger,
    questionnaireVersion: QUESTIONNAIRE_VERSION,
    scoringRuleVersion: SCORING_RULE_VERSION,
    immediateOverride: false,
    preparationFlag,
    criticalZeroCount,
    criticalOneCount,
    criticalGatePassed,
    domains,
    overallScore: domainPercentage(overallPoints, OVERALL_MAX_POINTS),
    overallPoints,
    reassessmentRequired: decision.pathway === 'PREPARATION_READINESS',
    responses,
  };
}

/** Participant-facing preparation activities. No scores or percentages. */
export function preparationFocus(scored: ReadinessScore): PreparationActivity[] {
  if (scored.pathway !== 'PREPARATION_READINESS') return [];
  const focus: PreparationActivity[] = [];
  for (const domain of scored.domains) {
    if (!domain.classification || domain.classification === 'DOMAIN_READY') continue;
    const activity = PREPARATION_ACTIVITIES[domain.index];
    if (activity) focus.push(activity);
  }
  return focus;
}
