import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createUserClient } from '@/lib/supabaseClient';
import { requireUser } from '@/lib/adminAuth';

export async function POST(request: NextRequest) {
  // Shared guard: authenticates the session AND enforces the CSRF origin check
  // for this mutating request (defense-in-depth on top of SameSite=Lax cookies).
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

  const userId = userResult.user.id;

  try {
    const {
      presentingConcern,
      presentingConcernOther,
      stress,
      emotionalIntensity,
      bodyTension,
      regulationIssue,
      regulationIssueOther,
      sleepQuality,
      goals,
    } = await request.json();

    if (!presentingConcern && !presentingConcernOther) {
      return NextResponse.json({ error: 'Please select a presenting concern' }, { status: 400 });
    }

    // Upsert user_progress record (RLS-enforced to this user's row)
    await createUserClient(request).from('user_progress').upsert(
      {
        user_id: userId,
        intake_completed: true,
        presenting_concern: presentingConcern,
        presenting_concern_other: presentingConcernOther,
        stress_before: stress,
        emotional_intensity_before: emotionalIntensity,
        body_tension_before: bodyTension,
        regulation_issue: regulationIssue,
        regulation_issue_other: regulationIssueOther,
        sleep_quality: sleepQuality,
        goals,
        intake_date: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
