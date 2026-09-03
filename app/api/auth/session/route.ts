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

    // Fetch role and intake status in parallel (RLS-enforced to this user's rows)
    const db = createUserClient(request);
    const [roleResult, progressResult] = await Promise.all([
      db.from('user_roles').select('role').eq('user_id', user.id).single(),
      db.from('user_progress').select('intake_completed').eq('user_id', user.id).maybeSingle(),
    ]);

    let role = 'user';
    if (!roleResult.error && roleResult.data?.role) {
      role = roleResult.data.role;
    }

    let intakeCompleted = false;
    if (!progressResult.error && progressResult.data?.intake_completed) {
      intakeCompleted = true;
    }

    return NextResponse.json(
      { user: { ...user }, role, intakeCompleted },
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
