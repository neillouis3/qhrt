import { supabaseServer } from '@/lib/supabaseClient';
import type {
  AssessmentDefinition,
  AssessmentEvaluation,
  AssessmentResult,
  PublicAssessment,
  ResultWorkbook,
} from './types';
import { normalizeOutcomes, normalizeQuestions } from './validate';

export const ASSESSMENT_COLUMNS =
  'id, slug, title, description, instructions, disclaimer, cover_image, scoring_method, questions, outcomes, display_order, is_active, created_at, updated_at';

export function toDefinition(row: Record<string, unknown>): AssessmentDefinition {
  return {
    ...(row as unknown as AssessmentDefinition),
    questions: normalizeQuestions(row.questions),
    outcomes: normalizeOutcomes(row.outcomes),
  };
}

export async function getActiveAssessmentBySlug(slug: string) {
  const { data, error } = await supabaseServer
    .from('assessments')
    .select(ASSESSMENT_COLUMNS)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
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
    questions: a.questions.map((q) => ({
      key: q.key,
      text: q.text,
      type: q.type,
      options: q.options.map(({ value, label }) => ({ value, label })),
      required: q.required,
      showIf: q.showIf,
    })),
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
