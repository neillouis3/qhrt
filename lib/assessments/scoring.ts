import type {
  AssessmentAnswers,
  AssessmentDefinition,
  AssessmentEvaluation,
  AssessmentOutcome,
  AssessmentQuestion,
  QuestionCondition,
} from './types';

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

export function evaluateAssessment(
  assessment: Pick<AssessmentDefinition, 'scoring_method' | 'questions' | 'outcomes'>,
  answers: AssessmentAnswers
): AssessmentEvaluation {
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

  const matches = assessment.outcomes.filter((o) => {
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
  const chosen = matches.length > 0 ? matches : assessment.outcomes.filter((o) => o.match === 'fallback');

  return {
    score,
    topCategory,
    categoryScores,
    outcomes: chosen.map(({ key, label, summary, workbookIds }) => ({
      key,
      label,
      summary,
      workbookIds,
    })),
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
