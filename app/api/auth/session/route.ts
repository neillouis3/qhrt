import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
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

    const db = createUserClient(request);
    const [roleResult, progressResult, avatarResult] = await Promise.all([
      db.from('user_roles').select('role').eq('user_id', user.id).single(),
      db.from('user_progress').select('intake_completed').eq('user_id', user.id).maybeSingle(),
      db.from('user_avatars').select('updated_at').eq('user_id', user.id).maybeSingle(),
    ]);

    let role = 'user';
    if (!roleResult.error && roleResult.data?.role) {
      role = roleResult.data.role;
    }

    const intakeCompleted = Boolean(progressResult.data?.intake_completed);

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
      { user: userWithAvatar, role, intakeCompleted },
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
