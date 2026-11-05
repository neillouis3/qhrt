import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireCsrf } from '@/lib/csrf';
import { rateLimit } from '@/lib/rateLimiter';
import { apiError, missingRelation, schemaMissingResponse } from '@/lib/apiError';
import {
  evaluateAssessment,
  getActiveReadinessAssessment,
  validateAnswers,
  type MatchedOutcome,
} from '@/lib/assessments';
import {
  issueReadinessCookieValue,
  READINESS_COOKIE,
  readReadinessPass,
  readinessCookieOptions,
} from '@/lib/readiness';
import {
  getPathwayCopy,
  loadPathwayProgress,
  optionalRequestUser,
  persistReadinessForUser,
} from '@/lib/pathway';

function copyFromOutcome(outcome: MatchedOutcome) {
  return {
    title: outcome.label,
    body: outcome.summary,
    allowSignup: outcome.allowSignup,
    allowSessions: outcome.allowSessions,
  };
}

export async function GET(request: NextRequest) {
  const user = await optionalRequestUser(request);
  if (user) {
    const progress = await loadPathwayProgress(user.id);
    if (progress.pathway) {
      const copy = await getPathwayCopy(progress.pathway);
      return NextResponse.json({
        complete: true,
        pathway: progress.pathway,
        allowSignup: copy?.allowSignup !== false,
        allowSessions: progress.allowSessions,
        copy: copy
          ? {
              title: copy.title,
              body: copy.body,
              allowSignup: copy.allowSignup,
              allowSessions: copy.allowSessions,
            }
          : null,
      });
    }
  }

  const pass = await readReadinessPass(request);
  if (!pass) return NextResponse.json({ complete: false });
  const outcome = pass.evaluation.outcomes[0];
  return NextResponse.json({
    complete: true,
    pathway: pass.pathway,
    allowSignup: pass.allowSignup,
    allowSessions: pass.allowSessions,
    copy: outcome ? copyFromOutcome(outcome) : null,
  });
}

export async function POST(request: NextRequest) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = await rateLimit(`${ip}:readiness`, 'auth');
  if (!rl.success) {
    return NextResponse.json({ error: 'Please wait a moment before trying again.' }, { status: 429 });
  }

  const { assessment, error } = await getActiveReadinessAssessment();
  if (error) {
    if (missingRelation(error) || error.code === '42703' || error.code === 'PGRST204') {
      return schemaMissingResponse('Readiness', 'supabase/017_assessment_kind_and_readiness.sql');
    }
    return apiError(error, '[api/readiness/complete] load');
  }
  if (!assessment) {
    return NextResponse.json(
      { error: 'No active readiness check. Add one in Content with type Program readiness.' },
      { status: 404 }
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Answer each question before continuing.' }, { status: 400 });
  }

  const answersRaw = raw && typeof raw === 'object' && 'answers' in raw ? raw.answers : raw;
  const { answers, errors } = validateAnswers(assessment.questions, answersRaw);
  if (errors.length > 0) {
    return NextResponse.json({ error: errors[0], errors }, { status: 400 });
  }

  const evaluation = evaluateAssessment(assessment, answers);
  const outcome = evaluation.outcomes[0];
  if (!outcome) {
    return NextResponse.json({ error: 'No starting point matched these answers.' }, { status: 400 });
  }

  const copy = copyFromOutcome(outcome);
  const user = await optionalRequestUser(request);

  if (user) {
    await persistReadinessForUser(user.id, {
      assessmentId: assessment.id,
      pathway: outcome.key,
      allowSessions: outcome.allowSessions,
      answers,
      evaluation,
    });
  }

  if (!outcome.allowSignup) {
    const response = NextResponse.json({
      pathway: outcome.key,
      allowSignup: false,
      allowSessions: false,
      copy,
      evaluation,
    });
    response.cookies.delete(READINESS_COOKIE);
    return response;
  }

  const token = await issueReadinessCookieValue({
    assessmentId: assessment.id,
    pathway: outcome.key,
    allowSignup: true,
    allowSessions: outcome.allowSessions,
    answers,
    evaluation,
  });
  if (!token) {
    return NextResponse.json({ error: 'Could not save those answers. Try again.' }, { status: 500 });
  }

  const response = NextResponse.json({
    pathway: outcome.key,
    allowSignup: true,
    allowSessions: outcome.allowSessions,
    copy,
    evaluation,
  });
  response.cookies.set(READINESS_COOKIE, token, readinessCookieOptions());
  return response;
}
