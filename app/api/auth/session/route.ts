import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { parsePathwayProgress, programSessionsOpen } from '@/lib/pathway';
import { createRequestClient, createUserClient, hasSupabaseAuthCookie } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    if (!hasSupabaseAuthCookie(request)) {
      return NextResponse.json(
        { user: null },
        {
          status: 200,
          headers: { 'cache-control': 'private, no-store' },
        }
      );
    }

    const supabase = createRequestClient(request);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        { user: null },
        {
          status: 200,
          headers: { 'cache-control': 'private, no-store, max-age=0' },
        }
      );
    }

    // Fetch role and intake status in parallel (RLS-enforced to this user's rows)
    const db = createUserClient(request);
    const [roleResult, progressResult, avatarResult] = await Promise.all([
      db.from('user_roles').select('role').eq('user_id', user.id).single(),
      db
        .from('user_progress')
        .select('intake_completed, readiness_pathway, readiness_allow_sessions, readiness_ack_at')
        .eq('user_id', user.id)
        .maybeSingle(),
      db.from('user_avatars').select('updated_at').eq('user_id', user.id).maybeSingle(),
    ]);

    let role = 'user';
    if (!roleResult.error && roleResult.data?.role) {
      role = roleResult.data.role;
    }

    let progressRow: {
      intake_completed?: boolean | null;
      readiness_pathway?: string | null;
      readiness_allow_sessions?: boolean | null;
      readiness_ack_at?: string | null;
    } | null = progressResult.error ? null : progressResult.data;
    if (progressResult.error && (progressResult.error.code === '42703' || progressResult.error.code === 'PGRST204')) {
      const retry = await db
        .from('user_progress')
        .select('intake_completed')
        .eq('user_id', user.id)
        .maybeSingle();
      progressRow = retry.error ? null : retry.data;
    }

    const intakeCompleted = Boolean(progressRow?.intake_completed);
    const programOpen = programSessionsOpen(parsePathwayProgress(progressRow));

    const avatarAt =
      !avatarResult.error && typeof avatarResult.data?.updated_at === 'string'
        ? avatarResult.data.updated_at
        : null;
    const userWithAvatar = {
      ...user,
      user_metadata: {
        ...(user.user_metadata ?? {}),
        avatar_at: avatarAt,
      },
    };

    return NextResponse.json(
      { user: userWithAvatar, role, intakeCompleted, programOpen },
      {
        status: 200,
        headers: {
          'cache-control': 'private, no-store, max-age=0',
        },
      }
    );
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
