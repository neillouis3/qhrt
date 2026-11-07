import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireUser } from '@/lib/adminAuth';
import { createUserClient } from '@/lib/supabaseClient';
import {
  acknowledgePathway,
  chooseReadinessPathway,
  getPathwayCopy,
  loadPathwayProgress,
  preparationActivitiesForUser,
  programSessionsOpen,
} from '@/lib/pathway';

async function pathwayPayload(userId: string, request: NextRequest) {
  const progress = await loadPathwayProgress(userId);
  const copy = progress.pathway ? await getPathwayCopy(progress.pathway) : null;
  const db = createUserClient(request);
  const { data } = await db
    .from('user_progress')
    .select('intake_completed')
    .eq('user_id', userId)
    .maybeSingle();
  const intakeCompleted = Boolean(data?.intake_completed);
  const programOpen = programSessionsOpen(progress);
  return {
    pathway: progress.pathway,
    allowSessions: progress.allowSessions,
    acknowledged: progress.acknowledged,
    programOpen,
    copy: copy
      ? {
          title: copy.title,
          body: copy.body,
          allowSignup: copy.allowSignup,
          allowSessions: copy.allowSessions,
        }
      : progress.pathway
        ? {
            title: 'Your starting point',
            body: 'Read your recommended starting point before a session.',
            allowSignup: true,
            allowSessions: progress.allowSessions,
          }
        : null,
    nextHref: intakeCompleted ? '/home' : '/onboarding',
    preparationFocus: await preparationActivitiesForUser(userId, progress.pathway),
  };
}

export async function GET(request: NextRequest) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(await pathwayPayload(userResult.user.id, request));
}

export async function POST(request: NextRequest) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { action?: unknown; pathway?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  if (body.action === 'choose') {
    const pathway = typeof body.pathway === 'string' ? body.pathway : '';
    const chosen = await chooseReadinessPathway(userResult.user.id, pathway);
    if (chosen.error) return NextResponse.json({ error: chosen.error }, { status: 400 });
    const payload = await pathwayPayload(userResult.user.id, request);
    return NextResponse.json({
      ...payload,
      allowSessions: chosen.progress.allowSessions,
      acknowledged: chosen.progress.acknowledged,
      programOpen: programSessionsOpen(chosen.progress),
    });
  }

  const { error, progress } = await acknowledgePathway(userResult.user.id);
  if (error) {
    return NextResponse.json({ error, code: 'PATHWAY_HOLD' }, { status: 403 });
  }

  const payload = await pathwayPayload(userResult.user.id, request);
  return NextResponse.json({
    ...payload,
    allowSessions: progress.allowSessions,
    acknowledged: progress.acknowledged,
    programOpen: programSessionsOpen(progress),
  });
}
