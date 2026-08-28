import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createUserClient } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    // Verify session using SSR client with cookie handlers
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // No-op in GET - read only.
          },
        },
      }
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
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
          // Cache session response briefly to avoid thundering herd on rapid navs
          'cache-control': 'public, max-age=5, s-maxage=10',
        },
      }
    );
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
