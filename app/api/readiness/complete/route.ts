import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireCsrf } from '@/lib/csrf';
import { rateLimit } from '@/lib/rateLimiter';
import { apiError, missingRelation, schemaMissingResponse } from '@/lib/apiError';
import {
  getActiveReadinessAssessment,
  selectReadinessOutcome,
  validateAnswers,
  type MatchedOutcome,
} from '@/lib/assessments';
import { preparationFocus, scoreReadiness } from '@/lib/pathwayScoring';
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
  preparationActivitiesForUser,
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
        preparationFocus: await preparationActivitiesForUser(user.id, progress.pathway),
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

  const body = raw && typeof raw === 'object' ? raw : {};
  if ('action' in body && body.action === 'choose' && 'pathway' in body && body.pathway === 'preparation') {
    const pass = await readReadinessPass(request);
    if (!pass || (pass.pathway !== 'self_directed' && pass.pathway !== 'additional_time')) {
      return NextResponse.json({ error: 'That starting point cannot be changed from here.' }, { status: 400 });
    }
    const copy = await getPathwayCopy('preparation');
    if (!copy?.allowSignup) {
      return NextResponse.json({ error: 'That starting point is not available.' }, { status: 400 });
    }
    const token = await issueReadinessCookieValue({
      assessmentId: pass.assessmentId,
      pathway: 'preparation',
      allowSignup: true,
      allowSessions: copy.allowSessions,
      answers: pass.answers,
      evaluation: {
        score: null,
        topCategory: null,
        categoryScores: {},
        outcomes: [
          {
            key: 'preparation',
            label: copy.title,
            summary: copy.body,
            workbookIds: [],
            allowSignup: true,
            allowSessions: copy.allowSessions,
          },
        ],
      },
    });
    if (!token) {
      return NextResponse.json({ error: 'Could not update that starting point. Try again.' }, { status: 500 });
    }
    const response = NextResponse.json({ pathway: 'preparation', allowSessions: copy.allowSessions });
    response.cookies.set(READINESS_COOKIE, token, readinessCookieOptions());
    return response;
  }

  const answersRaw = 'answers' in body ? body.answers : raw;
  const attemptId = 'attemptId' in body && typeof body.attemptId === 'string' ? body.attemptId : null;
  const { answers, errors } = validateAnswers(assessment.questions, answersRaw);
  if (errors.length > 0) {
    return NextResponse.json({ error: errors[0], errors }, { status: 400 });
  }

  const scored = scoreReadiness(answers);
  if (scored.status === 'INCOMPLETE' || !scored.appPathway) {
    return NextResponse.json(
      { error: 'Please answer every question before your starting point is chosen.' },
      { status: 400 }
    );
  }
  const outcome = selectReadinessOutcome(assessment, answers);
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
      evaluation: { score: null, topCategory: null, categoryScores: {}, outcomes: [outcome] },
      attemptId,
    });
  }

  if (!outcome.allowSignup) {
    const response = NextResponse.json({
      pathway: outcome.key,
      allowSignup: false,
      allowSessions: false,
      copy,
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
    evaluation: { score: null, topCategory: null, categoryScores: {}, outcomes: [outcome] },
  });
  if (!token) {
    return NextResponse.json({ error: 'Could not save those answers. Try again.' }, { status: 500 });
  }

  const response = NextResponse.json({
    pathway: outcome.key,
    allowSignup: true,
    allowSessions: outcome.allowSessions,
    copy,
    preparationFocus: preparationFocus(scored),
  });
  response.cookies.set(READINESS_COOKIE, token, readinessCookieOptions());
  return response;
}
