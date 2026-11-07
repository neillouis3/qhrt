import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { AssessmentAnswers, AssessmentEvaluation } from '@/lib/assessments';
import { getActiveReadinessAssessment } from '@/lib/assessments';
import { preparationFocus, scoreReadiness, type PreparationActivity } from '@/lib/pathwayScoring';
import { READINESS_PATH } from '@/lib/readiness';
import { recordCompletedAttempt } from '@/lib/readinessAttempts';
import { createRequestClient, hasSupabaseAuthCookie, supabaseServer } from '@/lib/supabaseClient';

export const STARTING_POINT_PATH = '/starting-point';

export type PathwayProgress = {
  pathway: string | null;
  allowSessions: boolean;
  acknowledged: boolean;
};

export type PathwayCopy = {
  title: string;
  body: string;
  allowSignup: boolean;
  allowSessions: boolean;
};

const OPEN_PROGRESS: PathwayProgress = {
  pathway: null,
  allowSessions: true,
  acknowledged: true,
};

export function parsePathwayProgress(row: {
  readiness_pathway?: string | null;
  readiness_allow_sessions?: boolean | null;
  readiness_ack_at?: string | null;
} | null): PathwayProgress {
  const pathway = row?.readiness_pathway?.trim() || null;
  if (!pathway) return OPEN_PROGRESS;
  return {
    pathway,
    allowSessions: row?.readiness_allow_sessions !== false,
    acknowledged: Boolean(row?.readiness_ack_at),
  };
}

export function programSessionsOpen(progress: PathwayProgress): boolean {
  return progress.allowSessions && progress.acknowledged;
}

export function isStartingPointPath(pathname: string): boolean {
  return pathname === STARTING_POINT_PATH || pathname === `${STARTING_POINT_PATH}/`;
}

export function isProgramSessionPath(pathname: string): boolean {
  return (
    pathname.startsWith('/assessments') ||
    pathname.startsWith('/modules') ||
    pathname.startsWith('/breathe') ||
    pathname.startsWith('/wind-down') ||
    pathname.startsWith('/practice') ||
    pathname.startsWith('/pause') ||
    pathname.startsWith('/starting-out') ||
    pathname.startsWith('/diary')
  );
}

export function isProgramSessionApi(pathname: string): boolean {
  return (
    pathname.startsWith('/api/assessments') ||
    pathname.startsWith('/api/modules') ||
    pathname.startsWith('/api/diary')
  );
}

function missingPathwayColumn(error: { code?: string } | null | undefined): boolean {
  return error?.code === '42703' || error?.code === 'PGRST204';
}

export async function loadPathwayProgress(userId: string): Promise<PathwayProgress> {
  const { data, error } = await supabaseServer
    .from('user_progress')
    .select('readiness_pathway, readiness_allow_sessions, readiness_ack_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    if (!missingPathwayColumn(error)) {
      console.error('[pathway] load', error.message, error.code);
    }
    return OPEN_PROGRESS;
  }
  return parsePathwayProgress(data);
}

export async function getPathwayCopy(pathway: string): Promise<PathwayCopy | null> {
  const { assessment } = await getActiveReadinessAssessment();
  const outcome = assessment?.outcomes.find((item) => item.key === pathway);
  if (!outcome) return null;
  return {
    title: outcome.label,
    body: outcome.summary,
    allowSignup: outcome.allowSignup,
    allowSessions: outcome.allowSessions,
  };
}

export async function preparationActivitiesForUser(userId: string, pathway: string | null): Promise<PreparationActivity[]> {
  if (pathway !== 'preparation') return [];
  const { assessment } = await getActiveReadinessAssessment();
  if (!assessment) return [];
  const { data, error } = await supabaseServer
    .from('assessment_submissions')
    .select('answers')
    .eq('user_id', userId)
    .eq('assessment_id', assessment.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data?.answers || typeof data.answers !== 'object') return [];
  return preparationFocus(scoreReadiness(data.answers as AssessmentAnswers));
}

export async function persistReadinessForUser(
  userId: string,
  pass: {
    assessmentId: string;
    pathway: string;
    allowSessions: boolean;
    answers: AssessmentAnswers;
    evaluation: AssessmentEvaluation;
    attemptId?: string | null;
  }
): Promise<void> {
  const scored = scoreReadiness(pass.answers);
  const pathway = scored.appPathway ?? pass.pathway;
  const { error: submitError } = await supabaseServer.from('assessment_submissions').insert({
    user_id: userId,
    assessment_id: pass.assessmentId,
    answers: pass.answers,
    result: {
      pathway,
      questionnaireVersion: scored.questionnaireVersion,
      scoringRuleVersion: scored.scoringRuleVersion,
      finalRuleTrigger: scored.trigger,
      outcomes: pass.evaluation.outcomes.map((outcome) => ({
        key: outcome.key,
        label: outcome.label,
        summary: outcome.summary,
      })),
    },
  });
  if (submitError && submitError.code !== '42P01' && submitError.code !== 'PGRST205' && submitError.code !== '23503') {
    console.error('[pathway] assessment_submissions', submitError.message, submitError.code);
  }

  await recordCompletedAttempt({
    userId,
    questionnaireId: pass.assessmentId,
    attemptId: pass.attemptId ?? null,
    answers: pass.answers,
    scored,
  });

  const now = new Date().toISOString();
  const full = await supabaseServer.from('user_progress').upsert(
    {
      user_id: userId,
      readiness_pathway: pathway,
      readiness_at: now,
      readiness_allow_sessions: pass.allowSessions,
      readiness_ack_at: null,
    },
    { onConflict: 'user_id' }
  );
  if (!full.error) return;
  if (!missingPathwayColumn(full.error)) {
    console.error('[pathway] user_progress', full.error.message, full.error.code);
    return;
  }

  const fallback = await supabaseServer.from('user_progress').upsert(
    {
      user_id: userId,
      readiness_pathway: pathway,
      readiness_at: now,
    },
    { onConflict: 'user_id' }
  );
  if (fallback.error && fallback.error.code !== '42703' && fallback.error.code !== 'PGRST204') {
    console.error('[pathway] user_progress fallback', fallback.error.message, fallback.error.code);
  }
}

export async function acknowledgePathway(userId: string): Promise<{ error: string | null; progress: PathwayProgress }> {
  const progress = await loadPathwayProgress(userId);
  if (!progress.pathway) return { error: null, progress };
  if (progress.acknowledged) return { error: null, progress };

  const { error } = await supabaseServer
    .from('user_progress')
    .update({ readiness_ack_at: new Date().toISOString() })
    .eq('user_id', userId);
  if (error) {
    if (missingPathwayColumn(error)) return { error: null, progress: { ...progress, acknowledged: true } };
    console.error('[pathway] ack', error.message, error.code);
    return { error: 'Could not continue just now. Try again.', progress };
  }
  return { error: null, progress: { ...progress, acknowledged: true } };
}

/** Where to send someone who is not ready for a program session. */
export async function accessHoldTarget(userId: string, role: string | null): Promise<string | null> {
  if (role === 'admin') return null;
  const progress = await loadPathwayProgress(userId);
  if (!progress.pathway) {
    const { data, error } = await supabaseServer
      .from('user_progress')
      .select('intake_completed')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) return null;
    if (data?.intake_completed) return null;
    return READINESS_PATH;
  }
  if (!programSessionsOpen(progress)) return STARTING_POINT_PATH;
  return null;
}

const SWITCHABLE_PATHWAYS = new Set(['preparation']);

export async function chooseReadinessPathway(
  userId: string,
  pathway: string
): Promise<{ error: string | null; progress: PathwayProgress }> {
  const current = await loadPathwayProgress(userId);
  if (!SWITCHABLE_PATHWAYS.has(pathway)) {
    return { error: 'That starting point is not available from here.', progress: current };
  }
  if (current.pathway !== 'self_directed' && current.pathway !== 'additional_time') {
    return { error: 'That starting point cannot be changed from here.', progress: current };
  }
  const copy = await getPathwayCopy(pathway);
  if (!copy) return { error: 'That starting point is not available.', progress: current };

  const { error } = await supabaseServer
    .from('user_progress')
    .update({
      readiness_pathway: pathway,
      readiness_allow_sessions: copy.allowSessions,
      readiness_ack_at: null,
      readiness_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
  if (error) {
    if (missingPathwayColumn(error)) {
      return {
        error: null,
        progress: { pathway, allowSessions: copy.allowSessions, acknowledged: false },
      };
    }
    console.error('[pathway] choose', error.message, error.code);
    return { error: 'Could not update that starting point. Try again.', progress: current };
  }
  return {
    error: null,
    progress: { pathway, allowSessions: copy.allowSessions, acknowledged: false },
  };
}

export async function optionalRequestUser(request: NextRequest) {
  if (!hasSupabaseAuthCookie(request)) return null;
  const supabase = createRequestClient(request);
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export function pathwayHoldResponse() {
  return NextResponse.json(
    {
      error: 'Your recommended starting point comes before a session.',
      code: 'PATHWAY_HOLD',
    },
    { status: 403 }
  );
}

export function firstParagraph(text: string): string {
  return text.split(/\n\n+/)[0]?.trim() || text.trim();
}
