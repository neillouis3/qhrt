import type { AssessmentAnswers } from '@/lib/assessments';
import {
  nextAssessmentSequence,
  type ReadinessScore,
} from '@/lib/pathwayScoring';
import { supabaseServer } from '@/lib/supabaseClient';

export type OpenAttempt = {
  attemptId: string;
  status: string;
  sequence: number;
  answers: AssessmentAnswers;
  page: string | null;
};

function missingSchema(error: { code?: string } | null | undefined): boolean {
  return error?.code === '42P01' || error?.code === 'PGRST205' || error?.code === '42703' || error?.code === 'PGRST204';
}

function asAnswers(value: unknown): AssessmentAnswers {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const answers: AssessmentAnswers = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === 'string') answers[key] = item;
  }
  return answers;
}

function scoreColumns(scored: ReadinessScore): Record<string, string | number | boolean | null> {
  const columns: Record<string, string | number | boolean | null> = {
    immediate_readiness_override: scored.immediateOverride,
    preparation_flag: scored.preparationFlag,
    critical_zero_count: scored.criticalZeroCount,
    critical_one_count: scored.criticalOneCount,
    critical_gate_passed: scored.criticalGatePassed,
    overall_score: scored.overallScore,
    recommended_pathway: scored.pathway,
    final_rule_trigger: scored.trigger,
    reassessment_required: scored.reassessmentRequired,
    questionnaire_version: scored.questionnaireVersion,
    scoring_rule_version: scored.scoringRuleVersion,
  };
  for (const domain of scored.domains) {
    columns[`domain_${domain.index}_score`] = domain.points;
    columns[`domain_${domain.index}_percentage`] = domain.percentage;
    columns[`domain_${domain.index}_classification`] = domain.classification;
  }
  return columns;
}

async function sequences(userId: string): Promise<number[] | null> {
  const { data, error } = await supabaseServer
    .from('readiness_attempts')
    .select('assessment_sequence')
    .eq('user_id', userId);
  if (error) {
    if (!missingSchema(error)) console.error('[readiness] sequence', error.message, error.code);
    return null;
  }
  return (data ?? []).map((row) => Number(row.assessment_sequence) || 0);
}

async function replaceResponses(attemptId: string, scored: ReadinessScore): Promise<void> {
  const removed = await supabaseServer.from('readiness_responses').delete().eq('assessment_id', attemptId);
  if (removed.error && !missingSchema(removed.error)) {
    console.error('[readiness] responses clear', removed.error.message, removed.error.code);
  }
  if (scored.responses.length === 0) return;
  const now = new Date().toISOString();
  const inserted = await supabaseServer.from('readiness_responses').insert(
    scored.responses.map((response) => ({
      assessment_id: attemptId,
      question_id: response.questionId,
      question_code: response.questionCode,
      question_text: response.questionText,
      response_value: response.responseValue,
      numeric_score: response.numericScore,
      is_required: response.required,
      is_critical: response.critical,
      domain_membership: response.domainMembership,
      answered_at: now,
    }))
  );
  if (inserted.error && !missingSchema(inserted.error)) {
    console.error('[readiness] responses', inserted.error.message, inserted.error.code);
  }
}

export async function loadOpenAttempt(userId: string): Promise<OpenAttempt | null> {
  const { data, error } = await supabaseServer
    .from('readiness_attempts')
    .select('assessment_id, assessment_status, assessment_sequence, answers, resume_page')
    .eq('user_id', userId)
    .in('assessment_status', ['IN_PROGRESS', 'PAUSED'])
    .order('assessment_sequence', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) {
    if (error && !missingSchema(error)) console.error('[readiness] open', error.message, error.code);
    return null;
  }
  return {
    attemptId: String(data.assessment_id),
    status: String(data.assessment_status),
    sequence: Number(data.assessment_sequence) || 0,
    answers: asAnswers(data.answers),
    page: typeof data.resume_page === 'string' ? data.resume_page : null,
  };
}

export async function startAttempt(
  userId: string,
  questionnaireId: string,
  forceNew: boolean
): Promise<OpenAttempt | null> {
  if (!forceNew) {
    const open = await loadOpenAttempt(userId);
    if (open) {
      await touchAttempt(userId, open.attemptId, 'resume', open.answers, open.page);
      return { ...open, status: 'IN_PROGRESS' };
    }
  }

  const existing = await sequences(userId);
  if (!existing) return null;
  const now = new Date().toISOString();
  const inserted = await supabaseServer
    .from('readiness_attempts')
    .insert({
      user_id: userId,
      questionnaire_id: questionnaireId,
      assessment_sequence: nextAssessmentSequence(existing),
      questionnaire_version: '1.0',
      scoring_rule_version: '1.0',
      assessment_status: 'IN_PROGRESS',
      started_at: now,
      last_saved_at: now,
      answers: {},
    })
    .select('assessment_id, assessment_sequence')
    .single();
  if (inserted.error || !inserted.data) {
    if (inserted.error && !missingSchema(inserted.error)) {
      console.error('[readiness] start', inserted.error.message, inserted.error.code);
    }
    return null;
  }
  return {
    attemptId: String(inserted.data.assessment_id),
    status: 'IN_PROGRESS',
    sequence: Number(inserted.data.assessment_sequence) || 0,
    answers: {},
    page: null,
  };
}

export async function touchAttempt(
  userId: string,
  attemptId: string,
  action: 'save' | 'pause' | 'resume',
  answers: AssessmentAnswers,
  page: string | null
): Promise<OpenAttempt | null> {
  const current = await supabaseServer
    .from('readiness_attempts')
    .select('assessment_id, assessment_status, assessment_sequence')
    .eq('assessment_id', attemptId)
    .eq('user_id', userId)
    .maybeSingle();
  if (current.error || !current.data) {
    if (current.error && !missingSchema(current.error)) {
      console.error('[readiness] touch', current.error.message, current.error.code);
    }
    return null;
  }
  const status = String(current.data.assessment_status);
  if (status !== 'IN_PROGRESS' && status !== 'PAUSED') return null;
  const nextStatus = action === 'pause' ? 'PAUSED' : 'IN_PROGRESS';
  const updated = await supabaseServer
    .from('readiness_attempts')
    .update({
      assessment_status: nextStatus,
      answers,
      resume_page: page,
      last_saved_at: new Date().toISOString(),
    })
    .eq('assessment_id', attemptId)
    .eq('user_id', userId);
  if (updated.error && !missingSchema(updated.error)) {
    console.error('[readiness] save', updated.error.message, updated.error.code);
    return null;
  }
  return {
    attemptId,
    status: nextStatus,
    sequence: Number(current.data.assessment_sequence) || 0,
    answers,
    page,
  };
}

/** Writes one completed or exited attempt. A finished attempt is not edited. */
export async function recordCompletedAttempt(input: {
  userId: string;
  questionnaireId: string;
  attemptId: string | null;
  answers: AssessmentAnswers;
  scored: ReadinessScore;
}): Promise<void> {
  if (input.scored.status !== 'COMPLETED' && input.scored.status !== 'EXITED_IMMEDIATE_ASSISTANCE') return;
  const now = new Date().toISOString();
  const patch = {
    ...scoreColumns(input.scored),
    assessment_status: input.scored.status,
    answers: input.answers,
    last_saved_at: now,
    completed_at: now,
  };

  if (input.attemptId) {
    const current = await supabaseServer
      .from('readiness_attempts')
      .select('assessment_status')
      .eq('assessment_id', input.attemptId)
      .eq('user_id', input.userId)
      .maybeSingle();
    const status = current.data ? String(current.data.assessment_status) : '';
    if (!current.error && (status === 'IN_PROGRESS' || status === 'PAUSED')) {
      const updated = await supabaseServer
        .from('readiness_attempts')
        .update(patch)
        .eq('assessment_id', input.attemptId)
        .eq('user_id', input.userId);
      if (!updated.error) {
        await replaceResponses(input.attemptId, input.scored);
        return;
      }
      if (!missingSchema(updated.error)) {
        console.error('[readiness] complete', updated.error.message, updated.error.code);
      }
    }
  }

  const existing = await sequences(input.userId);
  if (!existing) return;
  const inserted = await supabaseServer
    .from('readiness_attempts')
    .insert({
      user_id: input.userId,
      questionnaire_id: input.questionnaireId,
      assessment_sequence: nextAssessmentSequence(existing),
      started_at: now,
      ...patch,
    })
    .select('assessment_id')
    .single();
  if (inserted.error || !inserted.data) {
    if (inserted.error && !missingSchema(inserted.error)) {
      console.error('[readiness] insert', inserted.error.message, inserted.error.code);
    }
    return;
  }
  await replaceResponses(String(inserted.data.assessment_id), input.scored);
}
