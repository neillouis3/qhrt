import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createUserClient, supabaseServer } from '@/lib/supabaseClient';
import { requireUser } from '@/lib/adminAuth';
import { apiError } from '@/lib/apiError';
import { toDateKey } from '@/lib/dateKey';
import {
  appendCheckInHistory,
  appendPresenceDay,
  buildCheckInWeek,
  homeCheckInDayFromUser,
  isHomeCheckInValue,
  presenceDaysFromUserMetadata,
  syncCheckInToDiary,
} from '@/lib/homeCheckIn';

export async function GET(request: NextRequest) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const today = toDateKey(new Date());
  const meta = (userResult.user.user_metadata ?? {}) as Record<string, unknown>;
  const value = homeCheckInDayFromUser(userResult.user, today);

  return NextResponse.json({
    date: today,
    value,
    week: buildCheckInWeek(meta, today),
  });
}

export async function POST(request: NextRequest) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const value = body?.value;
    if (!isHomeCheckInValue(value)) {
      return NextResponse.json({ error: 'Invalid check-in value.' }, { status: 400 });
    }

    const today = toDateKey(new Date());
    const existing = homeCheckInDayFromUser(userResult.user, today);
    if (existing) {
      return NextResponse.json({ date: today, value: existing });
    }

    const userId = userResult.user.id;
    const { data: existingUser, error: getError } = await supabaseServer.auth.admin.getUserById(userId);
    if (getError) return apiError(getError, '[api/user/home-check-in] getUserById');

    const existingMeta = (existingUser?.user?.user_metadata ?? {}) as Record<string, unknown>;
    const presenceDays = appendPresenceDay(presenceDaysFromUserMetadata(existingMeta), today);
    const history = appendCheckInHistory(existingMeta, today, value);
    const nextMeta = {
      ...existingMeta,
      home_check_in_day: { date: today, value },
      home_check_in_history: history,
      presence_days: presenceDays,
    };

    const { error: metaError } = await supabaseServer.auth.admin.updateUserById(userId, {
      user_metadata: nextMeta,
    });
    if (metaError) return apiError(metaError, '[api/user/home-check-in] updateUserById');

    try {
      await syncCheckInToDiary(createUserClient(request), userId, today, value);
    } catch (syncErr) {
      console.error('[api/user/home-check-in] diary sync failed:', syncErr);
    }

    return NextResponse.json({ date: today, value });
  } catch (err) {
    return apiError(err, '[api/user/home-check-in] POST');
  }
}
