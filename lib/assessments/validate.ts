import type {
  AnswerOption,
  AssessmentAnswers,
  AssessmentOutcome,
  AssessmentQuestion,
  OutcomeMatch,
  QuestionType,
  ScoringMethod,
} from './types';
import { visibleQuestions } from './scoring';

const SCORING_METHODS: ScoringMethod[] = ['sum', 'mean', 'top_category'];
const QUESTION_TYPES: QuestionType[] = ['choice', 'text'];
const OUTCOME_MATCHES: OutcomeMatch[] = ['score_range', 'top_category', 'fallback'];

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
  return {
    key: str(q.key),
    text: str(q.text),
    type,
    options: type === 'choice' ? options : [],
    reverse: q.reverse === true,
    category: optStr(q.category),
    required: q.required === undefined ? true : q.required === true,
    showIf,
  };
}

export function normalizeOutcome(raw: unknown): AssessmentOutcome {
  const o = isObj(raw) ? raw : {};
  return {
    key: str(o.key),
    label: str(o.label),
    summary: str(o.summary),
    match: OUTCOME_MATCHES.includes(o.match as OutcomeMatch) ? (o.match as OutcomeMatch) : 'fallback',
    min: num(o.min),
    max: num(o.max),
    category: optStr(o.category),
    workbookIds: Array.isArray(o.workbookIds) ? o.workbookIds.map(str).filter(Boolean) : [],
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
  if (!title) errors.push('Title is required.');
  if (!SLUG_PATTERN.test(slug)) errors.push('Slug must be lowercase letters, numbers, and single dashes.');
  if (!SCORING_METHODS.includes(scoringMethod)) errors.push('Choose a scoring method.');

  const questions = normalizeQuestions(body.questions);
  const outcomes = normalizeOutcomes(body.outcomes);
  if (questions.length === 0) errors.push('Add at least one question.');

  const seenKeys = new Map<string, AssessmentQuestion>();
  const categories = new Set<string>();
  questions.forEach((q, i) => {
    const label = `Question ${i + 1}`;
    if (!KEY_PATTERN.test(q.key)) errors.push(`${label}: key must use lowercase letters, numbers, or underscores.`);
    else if (seenKeys.has(q.key)) errors.push(`${label}: key "${q.key}" is used more than once.`);
    if (!q.text) errors.push(`${label}: question text is required.`);

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
    if (o.match === 'fallback') {
      o.min = null;
      o.max = null;
    }
    const unknown = o.workbookIds.filter((id) => !knownWorkbookIds.has(id));
    if (unknown.length > 0) errors.push(`${label}: links to a workbook that no longer exists.`);
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
    provided[q.key] = trimmed.slice(0, MAX_TEXT_ANSWER);
  }

  const answers: AssessmentAnswers = {};
  const errors: string[] = [];
  for (const q of visibleQuestions(questions, provided)) {
    if (provided[q.key] !== undefined) answers[q.key] = provided[q.key]!;
    else if (q.required) errors.push(`Please answer: ${q.text}`);
  }
  return { answers, errors };
}
