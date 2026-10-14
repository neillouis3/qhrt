export type ScoringMethod = 'sum' | 'mean' | 'top_category';
export type QuestionType = 'choice' | 'text';
export type OutcomeMatch = 'score_range' | 'top_category' | 'fallback';

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
}

export interface PublicAssessment {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  instructions: string | null;
  disclaimer: string | null;
  cover_image: string | null;
  questions: PublicQuestion[];
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
