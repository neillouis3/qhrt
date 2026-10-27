import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseClient';
import { requireUser } from '@/lib/adminAuth';
import { apiError } from '@/lib/apiError';
import { ONBOARDING_PRACTICE_TIMES, ONBOARDING_PRONOUNS, isId } from '@/lib/onboarding';
import { isAppLocale } from '@/lib/locale';

function clip(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function existingName(meta: Record<string, unknown>, key: string): string {
  const value = meta[key];
  return typeof value === 'string' ? value.trim().slice(0, 80) : '';
}

export async function PATCH(request: NextRequest) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

  const userId = userResult.user.id;

  try {
    const body = await request.json();

    const { data: existingUser, error: getError } = await supabaseServer.auth.admin.getUserById(
      userId
    );
    if (getError) return apiError(getError, '[api/settings] getUserById');

    const existingMeta = existingUser?.user?.user_metadata ?? {};
    const nextMeta: Record<string, unknown> = { ...existingMeta };

    if ('firstName' in body || 'lastName' in body || 'displayName' in body) {
      const firstName = 'firstName' in body ? clip(body.firstName, 80) : existingName(existingMeta, 'first_name');
      const lastName = 'lastName' in body ? clip(body.lastName, 80) : existingName(existingMeta, 'last_name');
      nextMeta.first_name = firstName;
      nextMeta.last_name = lastName;
      nextMeta.display_name =
        'displayName' in body && !('firstName' in body) && !('lastName' in body)
          ? clip(body.displayName, 80)
          : [firstName, lastName].filter(Boolean).join(' ');
    }

    if ('pronouns' in body) {
      nextMeta.pronouns = isId(ONBOARDING_PRONOUNS, body.pronouns) ? body.pronouns : null;
    }

    if ('practiceTime' in body) {
      nextMeta.practice_time = isId(ONBOARDING_PRACTICE_TIMES, body.practiceTime)
        ? body.practiceTime
        : null;
    }

    if ('homeCheckIn' in body) {
      nextMeta.home_check_in = body.homeCheckIn === true;
    }

    if ('notifyInApp' in body) nextMeta.notify_in_app = body.notifyInApp === true;
    if ('notifyWelcome' in body) nextMeta.notify_welcome = body.notifyWelcome === true;
    if ('notifyActivity' in body) nextMeta.notify_activity = body.notifyActivity === true;

    if ('locale' in body) {
      nextMeta.locale = isAppLocale(body.locale) ? body.locale : null;
    }

    const { error: metaError } = await supabaseServer.auth.admin.updateUserById(userId, {
      user_metadata: nextMeta,
    });

    if (metaError) return apiError(metaError, '[api/settings] updateUserById');

    return NextResponse.json({ success: true });
  } catch (err) {
    return apiError(err, '[api/settings] PATCH');
  }
}
