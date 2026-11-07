import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireCsrf } from '@/lib/csrf';
import { getActiveReadinessAssessment, type AssessmentAnswers } from '@/lib/assessments';
import { optionalRequestUser } from '@/lib/pathway';
import { loadOpenAttempt, startAttempt, touchAttempt } from '@/lib/readinessAttempts';

function answersFrom(value: unknown): AssessmentAnswers {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const answers: AssessmentAnswers = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === 'string') answers[key] = item;
  }
  return answers;
}

export async function GET(request: NextRequest) {
  const user = await optionalRequestUser(request);
  if (!user) return NextResponse.json({ attempt: null });
  const open = await loadOpenAttempt(user.id);
  if (!open) return NextResponse.json({ attempt: null });
  return NextResponse.json({
    attempt: {
      attemptId: open.attemptId,
      status: open.status,
      page: open.page,
      answers: open.answers,
    },
  });
}

export async function POST(request: NextRequest) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;

  const user = await optionalRequestUser(request);
  if (!user) return NextResponse.json({ attemptId: null });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Could not save your place.' }, { status: 400 });
  }
  const body = raw && typeof raw === 'object' ? raw : {};
  const action = 'action' in body && typeof body.action === 'string' ? body.action : 'save';
  const attemptId = 'attemptId' in body && typeof body.attemptId === 'string' ? body.attemptId : null;
  const page = 'page' in body && typeof body.page === 'string' ? body.page : null;
  const answers = answersFrom('answers' in body ? body.answers : null);
  const forceNew = 'forceNew' in body && body.forceNew === true;

  if (action === 'start') {
    const { assessment } = await getActiveReadinessAssessment();
    if (!assessment) return NextResponse.json({ attemptId: null });
    const started = await startAttempt(user.id, assessment.id, forceNew);
    return NextResponse.json({
      attemptId: started?.attemptId ?? null,
      status: started?.status ?? null,
      page: started?.page ?? null,
      answers: started?.answers ?? {},
    });
  }

  if (!attemptId || (action !== 'save' && action !== 'pause' && action !== 'resume')) {
    return NextResponse.json({ attemptId: null });
  }
  const saved = await touchAttempt(user.id, attemptId, action, answers, page);
  return NextResponse.json({
    attemptId: saved?.attemptId ?? null,
    status: saved?.status ?? null,
  });
}
