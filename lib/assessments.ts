import { supabaseServer } from '@/lib/supabaseClient';
import { isPracticeId, practiceById, PRACTICE_DONE, type PracticeId } from '@/lib/practices';

export type ScoringMethod = 'sum' | 'mean' | 'top_category';
export type QuestionType = 'choice' | 'text' | 'practice' | 'info';
export type OutcomeMatch = 'score_range' | 'top_category' | 'fallback' | 'stop';
export type AssessmentKind = 'check_in';

export interface AnswerOption {
  value: string;
  label: string;
  /** null = recorded but not scored */
  score: number | null;
}

export interface QuestionCondition {
  questionKey: string;
  values: string[];
}

export interface StopCondition {
  values: string[];
  outcomeKey: string;
}

export interface AssessmentQuestion {
  key: string;
  text: string;
  type: QuestionType;
  options: AnswerOption[];
  /** Flip the score within the option range (min + max - score). */
  reverse: boolean;
  category: string | null;
  required: boolean;
  /** Only shown (and scored) when an earlier answer matches. */
  showIf: QuestionCondition | null;
  /** Catalog id when type is practice. */
  practiceId: PracticeId | null;
  /** Optional title above the question body. */
  heading: string | null;
  /** Groups questions onto the same page. */
  section: string | null;
  /** If this answer matches, scoring stops and that outcome is returned. */
  stopIf: StopCondition | null;
}

export interface AssessmentOutcome {
  key: string;
  label: string;
  summary: string;
  match: OutcomeMatch;
  min: number | null;
  max: number | null;
  category: string | null;
  workbookIds: string[];
  /** Skip this outcome when an earlier answer matches. */
  excludeIf: QuestionCondition | null;
}

export interface AssessmentDefinition {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  instructions: string | null;
  disclaimer: string | null;
  cover_image: string | null;
  scoring_method: ScoringMethod;
  kind: AssessmentKind;
  questions: AssessmentQuestion[];
  outcomes: AssessmentOutcome[];
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Workbook {
  id: string;
  title: string;
  description: string | null;
  url: string;
  display_order: number;
  is_active: boolean;
}

export type AssessmentAnswers = Record<string, string>;

export interface MatchedOutcome {
  key: string;
  label: string;
  summary: string;
  workbookIds: string[];
}

export interface AssessmentEvaluation {
  score: number | null;
  topCategory: string | null;
  categoryScores: Record<string, number>;
  outcomes: MatchedOutcome[];
}

export interface ResultWorkbook {
  id: string;
  title: string;
  description: string | null;
  url: string;
}

export interface AssessmentResult extends AssessmentEvaluation {
  outcomes: (MatchedOutcome & { workbooks: ResultWorkbook[] })[];
  completedAt: string;
}

/** Public question shape — scores and reverse flags stay server-side. */
export interface PublicQuestion {
  key: string;
  text: string;
  type: QuestionType;
  options: { value: string; label: string }[];
  required: boolean;
  showIf: QuestionCondition | null;
  practiceId: PracticeId | null;
  heading: string | null;
  section: string | null;
  stopIf: { values: string[] } | null;
}

export interface PublicAssessment {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  instructions: string | null;
  disclaimer: string | null;
  cover_image: string | null;
  kind: AssessmentKind;
  questions: PublicQuestion[];
  outcomes: { key: string; label: string }[];
}

export interface AssessmentSummary {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  questionCount: number;
  lastCompletedAt: string | null;
}

function conditionMet(condition: QuestionCondition | null, answers: AssessmentAnswers): boolean {
  if (!condition) return true;
  const answer = answers[condition.questionKey];
  return answer !== undefined && condition.values.includes(answer);
}

/**
 * Questions the respondent should see, given current answers. A question whose
 * condition points at a hidden question is hidden too.
 */
export function visibleQuestions<Q extends Pick<AssessmentQuestion, 'key' | 'showIf'>>(
  questions: Q[],
  answers: AssessmentAnswers
): Q[] {
  const shown = new Set<string>();
  const result: Q[] = [];
  for (const q of questions) {
    if (q.showIf && !shown.has(q.showIf.questionKey)) continue;
    if (!conditionMet(q.showIf, answers)) continue;
    shown.add(q.key);
    result.push(q);
  }
  return result;
}

function questionScore(question: AssessmentQuestion, value: string): number | null {
  if (question.type !== 'choice') return null;
  const option = question.options.find((o) => o.value === value);
  if (!option || option.score === null) return null;
  if (!question.reverse) return option.score;
  const scores = question.options.map((o) => o.score).filter((s): s is number => s !== null);
  return Math.min(...scores) + Math.max(...scores) - option.score;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function inRange(value: number, outcome: AssessmentOutcome): boolean {
  if (outcome.min !== null && value < outcome.min) return false;
  if (outcome.max !== null && value > outcome.max) return false;
  return true;
}

export function stoppedOutcomeKey(
  questions: AssessmentQuestion[],
  answers: AssessmentAnswers
): string | null {
  for (const q of visibleQuestions(questions, answers)) {
    if (!q.stopIf || q.type !== 'choice') continue;
    const answer = answers[q.key];
    if (answer && q.stopIf.values.includes(answer)) return q.stopIf.outcomeKey;
  }
  return null;
}

function outcomeAllowed(outcome: AssessmentOutcome, answers: AssessmentAnswers): boolean {
  if (!outcome.excludeIf) return true;
  const answer = answers[outcome.excludeIf.questionKey];
  return !(answer && outcome.excludeIf.values.includes(answer));
}

function toMatched(outcome: AssessmentOutcome): MatchedOutcome {
  return {
    key: outcome.key,
    label: outcome.label,
    summary: outcome.summary,
    workbookIds: outcome.workbookIds,
  };
}

export function evaluateAssessment(
  assessment: Pick<AssessmentDefinition, 'scoring_method' | 'questions' | 'outcomes'>,
  answers: AssessmentAnswers
): AssessmentEvaluation {
  const stopKey = stoppedOutcomeKey(assessment.questions, answers);
  if (stopKey) {
    const stopped = assessment.outcomes.find((o) => o.key === stopKey);
    if (stopped) {
      return {
        score: null,
        topCategory: null,
        categoryScores: {},
        outcomes: [toMatched(stopped)],
      };
    }
  }

  const categoryScores: Record<string, number> = {};
  let total = 0;
  let scoredCount = 0;

  for (const q of visibleQuestions(assessment.questions, answers)) {
    const answer = answers[q.key];
    if (answer === undefined) continue;
    const score = questionScore(q, answer);
    if (score === null) continue;
    total += score;
    scoredCount += 1;
    if (q.category) categoryScores[q.category] = (categoryScores[q.category] ?? 0) + score;
  }

  let topCategory: string | null = null;
  for (const [category, value] of Object.entries(categoryScores)) {
    if (topCategory === null || value > categoryScores[topCategory]!) topCategory = category;
  }

  let score: number | null;
  if (assessment.scoring_method === 'mean') {
    score = scoredCount > 0 ? round2(total / scoredCount) : null;
  } else if (assessment.scoring_method === 'top_category') {
    score = topCategory ? categoryScores[topCategory]! : null;
  } else {
    score = scoredCount > 0 ? total : null;
  }

  const eligible = assessment.outcomes.filter(
    (o) => o.match !== 'stop' && outcomeAllowed(o, answers)
  );
  const matches = eligible.filter((o) => {
    if (o.match === 'score_range') return score !== null && inRange(score, o);
    if (o.match === 'top_category') {
      return (
        topCategory !== null &&
        o.category === topCategory &&
        inRange(categoryScores[topCategory]!, o)
      );
    }
    return false;
  });
  const chosen = matches.length > 0 ? matches : eligible.filter((o) => o.match === 'fallback');

  return {
    score,
    topCategory,
    categoryScores,
    outcomes: chosen.map(toMatched),
  };
}

/** Lowest and highest possible score for sum-scored assessments (ignores branching). */
export function scoreBounds(questions: AssessmentQuestion[]): { min: number; max: number } {
  let min = 0;
  let max = 0;
  for (const q of questions) {
    const scores = q.options.map((o) => o.score).filter((s): s is number => s !== null);
    if (q.type !== 'choice' || scores.length === 0) continue;
    min += Math.min(...scores);
    max += Math.max(...scores);
  }
  return { min, max };
}

const SCORING_METHODS: ScoringMethod[] = ['sum', 'mean', 'top_category'];
const QUESTION_TYPES: QuestionType[] = ['choice', 'text', 'practice', 'info'];
const OUTCOME_MATCHES: OutcomeMatch[] = ['score_range', 'top_category', 'fallback', 'stop'];
const KEY_PATTERN = /^[a-z0-9_]+$/;
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_TEXT_ANSWER = 2000;

type Obj = Record<string, unknown>;

function isObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function optStr(v: unknown): string | null {
  const s = str(v);
  return s ? s : null;
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Coerce a stored JSON question into the full shape, filling defaults. */
export function normalizeQuestion(raw: unknown): AssessmentQuestion {
  const q = isObj(raw) ? raw : {};
  const type = QUESTION_TYPES.includes(q.type as QuestionType) ? (q.type as QuestionType) : 'choice';
  const options: AnswerOption[] = Array.isArray(q.options)
    ? q.options.filter(isObj).map((o) => ({
        value: str(o.value),
        label: str(o.label),
        score: num(o.score),
      }))
    : [];
  const showIf =
    isObj(q.showIf) && str(q.showIf.questionKey)
      ? {
          questionKey: str(q.showIf.questionKey),
          values: Array.isArray(q.showIf.values) ? q.showIf.values.map(str).filter(Boolean) : [],
        }
      : null;
  const rawPracticeId = str(q.practiceId);
  const practiceId = type === 'practice' && isPracticeId(rawPracticeId) ? rawPracticeId : null;
  const catalog = practiceById(practiceId);
  const stopIf =
    type === 'choice' && isObj(q.stopIf) && str(q.stopIf.outcomeKey)
      ? {
          outcomeKey: str(q.stopIf.outcomeKey),
          values: Array.isArray(q.stopIf.values) ? q.stopIf.values.map(str).filter(Boolean) : [],
        }
      : null;
  return {
    key: str(q.key),
    text: str(q.text) || catalog?.title || '',
    type,
    options: type === 'choice' ? options : [],
    reverse: type === 'choice' && q.reverse === true,
    category: type === 'practice' || type === 'info' ? null : optStr(q.category),
    required: type === 'info' ? false : q.required === undefined ? true : q.required === true,
    showIf,
    practiceId,
    heading: optStr(q.heading),
    section: optStr(q.section),
    stopIf,
  };
}

export function normalizeOutcome(raw: unknown): AssessmentOutcome {
  const o = isObj(raw) ? raw : {};
  const excludeIf =
    isObj(o.excludeIf) && str(o.excludeIf.questionKey)
      ? {
          questionKey: str(o.excludeIf.questionKey),
          values: Array.isArray(o.excludeIf.values) ? o.excludeIf.values.map(str).filter(Boolean) : [],
        }
      : null;
  return {
    key: str(o.key),
    label: str(o.label),
    summary: str(o.summary),
    match: OUTCOME_MATCHES.includes(o.match as OutcomeMatch) ? (o.match as OutcomeMatch) : 'fallback',
    min: num(o.min),
    max: num(o.max),
    category: optStr(o.category),
    workbookIds: Array.isArray(o.workbookIds) ? o.workbookIds.map(str).filter(Boolean) : [],
    excludeIf,
  };
}

export function normalizeQuestions(raw: unknown): AssessmentQuestion[] {
  return Array.isArray(raw) ? raw.map(normalizeQuestion) : [];
}

export function normalizeOutcomes(raw: unknown): AssessmentOutcome[] {
  return Array.isArray(raw) ? raw.map(normalizeOutcome) : [];
}

export interface AssessmentInput {
  slug: string;
  title: string;
  description: string | null;
  instructions: string | null;
  disclaimer: string | null;
  cover_image: string | null;
  scoring_method: ScoringMethod;
  kind: AssessmentKind;
  questions: AssessmentQuestion[];
  outcomes: AssessmentOutcome[];
  display_order: number;
  is_active: boolean;
}

/** Validate an admin-submitted assessment document. */
export function validateAssessmentInput(
  raw: unknown,
  knownWorkbookIds: Set<string>
): { value: AssessmentInput; errors: string[] } {
  const body = isObj(raw) ? raw : {};
  const errors: string[] = [];

  const slug = str(body.slug).toLowerCase();
  const title = str(body.title);
  const scoringMethod = body.scoring_method as ScoringMethod;
  const kind: AssessmentKind = 'check_in';
  if (!title) errors.push('Title is required.');
  if (!SLUG_PATTERN.test(slug)) errors.push('Slug must be lowercase letters, numbers, and single dashes.');
  if (!SCORING_METHODS.includes(scoringMethod)) errors.push('Choose a scoring method.');

  const questions = normalizeQuestions(body.questions);
  const outcomes = normalizeOutcomes(body.outcomes);
  if (questions.filter((q) => q.type === 'choice' || q.type === 'text').length === 0) {
    errors.push('Add at least one question.');
  }

  const seenKeys = new Map<string, AssessmentQuestion>();
  const categories = new Set<string>();
  questions.forEach((q, i) => {
    const label =
      q.type === 'practice' ? `Practice ${i + 1}` : q.type === 'info' ? `Info ${i + 1}` : `Question ${i + 1}`;
    if (!KEY_PATTERN.test(q.key)) errors.push(`${label}: key must use lowercase letters, numbers, or underscores.`);
    else if (seenKeys.has(q.key)) errors.push(`${label}: key "${q.key}" is used more than once.`);
    if (!q.text) errors.push(`${label}: ${q.type === 'practice' ? 'title' : 'question text'} is required.`);

    if (q.type === 'practice') {
      if (!q.practiceId) errors.push(`${label}: pick a practice.`);
    }

    if (q.type === 'choice') {
      if (q.options.length < 2) errors.push(`${label}: add at least two answer options.`);
      const values = new Set<string>();
      q.options.forEach((o, j) => {
        if (!o.label || !o.value) errors.push(`${label}, option ${j + 1}: label and value are required.`);
        if (values.has(o.value)) errors.push(`${label}: option value "${o.value}" is repeated.`);
        values.add(o.value);
      });
      if (q.reverse && q.options.filter((o) => o.score !== null).length < 2) {
        errors.push(`${label}: reverse scoring needs at least two scored options.`);
      }
    }

    if (q.showIf) {
      const target = seenKeys.get(q.showIf.questionKey);
      if (!target) errors.push(`${label}: "show if" must point to an earlier question.`);
      else if (target.type !== 'choice') errors.push(`${label}: "show if" must point to a multiple-choice question.`);
      else if (q.showIf.values.length === 0) errors.push(`${label}: pick at least one answer for "show if".`);
      else if (q.showIf.values.some((v) => !target.options.some((o) => o.value === v))) {
        errors.push(`${label}: "show if" uses an answer that question "${target.key}" doesn't have.`);
      }
    }

    if (q.stopIf) {
      if (q.type !== 'choice') errors.push(`${label}: stop rules only apply to multiple choice.`);
      else if (q.stopIf.values.length === 0) errors.push(`${label}: pick at least one answer that stops the check.`);
      else if (q.stopIf.values.some((v) => !q.options.some((o) => o.value === v))) {
        errors.push(`${label}: a stop answer is not one of this question's options.`);
      }
    }

    if (q.category) categories.add(q.category);
    if (q.key) seenKeys.set(q.key, q);
  });

  if (scoringMethod === 'top_category' && categories.size === 0) {
    errors.push('Category scoring needs at least one question with a category.');
  }

  const outcomeKeys = new Set<string>();
  outcomes.forEach((o, i) => {
    const label = `Outcome ${i + 1}`;
    if (!KEY_PATTERN.test(o.key)) errors.push(`${label}: key must use lowercase letters, numbers, or underscores.`);
    else if (outcomeKeys.has(o.key)) errors.push(`${label}: key "${o.key}" is used more than once.`);
    outcomeKeys.add(o.key);
    if (!o.label) errors.push(`${label}: label is required.`);
    if (o.min !== null && o.max !== null && o.min > o.max) errors.push(`${label}: minimum is above maximum.`);
    if (o.match === 'top_category' && (!o.category || !categories.has(o.category))) {
      errors.push(`${label}: pick a category used by at least one question.`);
    }
    if (o.match !== 'top_category') o.category = null;
    if (o.match === 'fallback' || o.match === 'stop') {
      o.min = null;
      o.max = null;
    }
    if (o.excludeIf) {
      const target = seenKeys.get(o.excludeIf.questionKey);
      if (!target || target.type !== 'choice') {
        errors.push(`${label}: "skip when" must point to a multiple-choice question.`);
      } else if (o.excludeIf.values.length === 0) {
        errors.push(`${label}: pick at least one answer for "skip when".`);
      } else if (o.excludeIf.values.some((v) => !target.options.some((opt) => opt.value === v))) {
        errors.push(`${label}: "skip when" uses an answer that question does not have.`);
      }
    }
    const unknown = o.workbookIds.filter((id) => !knownWorkbookIds.has(id));
    if (unknown.length > 0) errors.push(`${label}: links to a workbook that no longer exists.`);
  });

  questions.forEach((q, i) => {
    if (!q.stopIf) return;
    const label = q.type === 'info' ? `Info ${i + 1}` : `Question ${i + 1}`;
    if (!outcomes.some((o) => o.key === q.stopIf!.outcomeKey)) {
      errors.push(`${label}: stop rule must point to an outcome on this assessment.`);
    }
  });

  return {
    value: {
      slug,
      title,
      description: optStr(body.description),
      instructions: optStr(body.instructions),
      disclaimer: optStr(body.disclaimer),
      cover_image: optStr(body.cover_image),
      scoring_method: scoringMethod,
      kind,
      questions,
      outcomes,
      display_order: num(body.display_order) ?? 0,
      is_active: body.is_active !== false,
    },
    errors,
  };
}

/** Keep only answers to visible questions and check required ones are present. */
export function validateAnswers(
  questions: AssessmentQuestion[],
  raw: unknown
): { answers: AssessmentAnswers; errors: string[] } {
  const input = isObj(raw) ? raw : {};
  const provided: AssessmentAnswers = {};
  for (const q of questions) {
    const v = input[q.key];
    if (typeof v !== 'string') continue;
    const trimmed = v.trim();
    if (!trimmed) continue;
    if (q.type === 'choice' && !q.options.some((o) => o.value === trimmed)) continue;
    if (q.type === 'practice' && trimmed !== PRACTICE_DONE) continue;
    provided[q.key] = trimmed.slice(0, MAX_TEXT_ANSWER);
  }

  const answers: AssessmentAnswers = {};
  const errors: string[] = [];
  const visible = visibleQuestions(questions, provided);
  const stopKey = stoppedOutcomeKey(questions, provided);
  for (const q of visible) {
    if (q.type === 'info' || q.type === 'practice') {
      if (provided[q.key] !== undefined) answers[q.key] = provided[q.key]!;
      continue;
    }
    if (provided[q.key] !== undefined) answers[q.key] = provided[q.key]!;
    else if (q.required && !stopKey) errors.push(`Please answer: ${q.text}`);
  }
  return { answers, errors };
}

export const ASSESSMENT_COLUMNS =
  'id, slug, title, description, instructions, disclaimer, cover_image, scoring_method, kind, questions, outcomes, display_order, is_active, created_at, updated_at';

export function toDefinition(row: Record<string, unknown>): AssessmentDefinition {
  return {
    ...(row as unknown as AssessmentDefinition),
    kind: 'check_in',
    questions: normalizeQuestions(row.questions),
    outcomes: normalizeOutcomes(row.outcomes),
  };
}

export async function getActiveAssessmentBySlug(slug: string) {
  if (slug === 'program-readiness') return { assessment: null, error: null };
  const { data, error } = await supabaseServer
    .from('assessments')
    .select(ASSESSMENT_COLUMNS)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  if (data?.kind === 'readiness') return { assessment: null, error: null };
  return { assessment: data ? toDefinition(data) : null, error };
}

export function toPublicAssessment(a: AssessmentDefinition): PublicAssessment {
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    description: a.description,
    instructions: a.instructions,
    disclaimer: a.disclaimer,
    cover_image: a.cover_image,
    kind: a.kind,
    questions: a.questions.map((q) => ({
      key: q.key,
      text: q.text,
      type: q.type,
      options: q.options.map(({ value, label }) => ({ value, label })),
      required: q.required,
      showIf: q.showIf,
      practiceId: q.practiceId,
      heading: q.heading,
      section: q.section,
      stopIf: q.stopIf ? { values: q.stopIf.values } : null,
    })),
    outcomes: a.outcomes.map((o) => ({ key: o.key, label: o.label })),
  };
}

/** Attach active workbook details to each matched outcome. */
export async function withWorkbooks(
  evaluation: AssessmentEvaluation,
  completedAt: string
): Promise<AssessmentResult> {
  const ids = [...new Set(evaluation.outcomes.flatMap((o) => o.workbookIds))];
  const byId = new Map<string, ResultWorkbook>();
  if (ids.length > 0) {
    const { data } = await supabaseServer
      .from('workbooks')
      .select('id, title, description, url')
      .in('id', ids)
      .eq('is_active', true);
    for (const w of data ?? []) byId.set(w.id, w);
  }
  return {
    ...evaluation,
    completedAt,
    outcomes: evaluation.outcomes.map((o) => ({
      ...o,
      workbooks: o.workbookIds.map((id) => byId.get(id)).filter((w): w is ResultWorkbook => !!w),
    })),
  };
}

