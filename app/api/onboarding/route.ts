import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createUserClient, supabaseServer } from '@/lib/supabaseClient';
import { requireUser } from '@/lib/adminAuth';
import { apiError } from '@/lib/apiError';
import {
  ONBOARDING_CONCERNS,
  ONBOARDING_EXPERIENCE,
  ONBOARDING_PRACTICE_TIMES,
  ONBOARDING_PRONOUNS,
  ONBOARDING_REFERRALS,
  ONBOARDING_REGULATION,
  ONBOARDING_RESOURCES,
  ONBOARDING_SLEEP,
  idsOf,
  isId,
  labelFor,
} from '@/lib/onboarding';

function clip(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function scale(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(10, Math.max(1, Math.round(n)));
}

function ageValue(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  if (rounded < 18 || rounded > 120) return null;
  return rounded;
}

export async function POST(request: NextRequest) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

  const userId = userResult.user.id;

  try {
    const body = await request.json();

    const firstName = clip(body.firstName, 80);
    const lastName = clip(body.lastName, 80);
    const concernOther = clip(body.concernOther, 200);
    const goals = clip(body.goals, 2000);
    const age = ageValue(body.age);
    const pronouns = isId(ONBOARDING_PRONOUNS, body.pronouns) ? body.pronouns : null;
    const referral = isId(ONBOARDING_REFERRALS, body.referral) ? body.referral : null;
    const concerns = idsOf(ONBOARDING_CONCERNS, body.concerns);
    const sleepQuality = isId(ONBOARDING_SLEEP, body.sleepQuality) ? body.sleepQuality : null;
    const regulationIssue = isId(ONBOARDING_REGULATION, body.regulationIssue)
      ? body.regulationIssue
      : null;
    const resources = idsOf(ONBOARDING_RESOURCES, body.resources);
    const experience = isId(ONBOARDING_EXPERIENCE, body.experience) ? body.experience : null;
    const practiceTime = isId(ONBOARDING_PRACTICE_TIMES, body.practiceTime)
      ? body.practiceTime
      : null;
    const stress = scale(body.stress, 5);
    const emotionalIntensity = scale(body.emotionalIntensity, 5);
    const bodyTension = scale(body.bodyTension, 5);

    if (!firstName) {
      return NextResponse.json({ error: 'Please add your first name' }, { status: 400 });
    }
    if (concerns.length === 0 && !concernOther) {
      return NextResponse.json({ error: 'Please tell us what you are facing' }, { status: 400 });
    }

    const primaryConcern =
      ONBOARDING_CONCERNS.find((item) => concerns.includes(item.id) && item.presenting !== 'other')
        ?.presenting ?? 'other';

    const concernLabels = concerns
      .map((id) => labelFor(ONBOARDING_CONCERNS, id))
      .filter(Boolean) as string[];
    const resourceLabels = resources
      .map((id) => labelFor(ONBOARDING_RESOURCES, id))
      .filter(Boolean) as string[];

    const presentingConcernOther = [...concernLabels, concernOther].filter(Boolean).join('; ');

    const goalLines = [
      goals,
      resourceLabels.length ? `Preferred resources: ${resourceLabels.join(', ')}` : '',
      experience ? `Experience: ${labelFor(ONBOARDING_EXPERIENCE, experience)}` : '',
      practiceTime ? `Practice time: ${labelFor(ONBOARDING_PRACTICE_TIMES, practiceTime)}` : '',
    ].filter(Boolean);

    const { data: existingUser } = await supabaseServer.auth.admin.getUserById(userId);
    const existingMeta = existingUser?.user?.user_metadata ?? {};

    const { error: metaError } = await supabaseServer.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...existingMeta,
        first_name: firstName,
        last_name: lastName,
        display_name: [firstName, lastName].filter(Boolean).join(' '),
        age,
        pronouns,
        referral_source: referral,
        preferred_resources: resources,
        experience_level: experience,
        practice_time: practiceTime,
      },
    });

    if (metaError) {
      return apiError(metaError, '[api/onboarding] updateUserById');
    }

    const { error: progressError } = await createUserClient(request).from('user_progress').upsert(
      {
        user_id: userId,
        intake_completed: true,
        presenting_concern: primaryConcern,
        presenting_concern_other: presentingConcernOther || null,
        stress_before: stress,
        emotional_intensity_before: emotionalIntensity,
        body_tension_before: bodyTension,
        regulation_issue: regulationIssue,
        sleep_quality: sleepQuality,
        goals: goalLines.join('\n'),
        intake_date: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    if (progressError) {
      return apiError(progressError, '[api/onboarding] user_progress upsert');
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return apiError(err, '[api/onboarding] POST');
  }
}
