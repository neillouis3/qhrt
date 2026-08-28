import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { supabaseServer } from '@/lib/supabaseClient';
import { checkCsrfOrigin } from '@/lib/csrf';

const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

/**
 * Apply the CSRF origin check for mutating requests. Returns a 403 NextResponse
 * when the Origin/Referer is cross-origin, or null when the check passes.
 * No-op for non-mutating methods (safe to call uniformly).
 */
function enforceCsrf(request: NextRequest): null | NextResponse {
  if (!MUTATING_METHODS.has(request.method.toUpperCase())) return null;
  return checkCsrfOrigin(request);
}

/**
 * Verify the caller is an authenticated admin.
 * Returns a NextResponse (401/403) on failure, or null on success.
 *
 * Also enforces the CSRF origin check for mutating requests (defense-in-depth on
 * top of SameSite=Lax cookies), so every admin mutating route inherits it here.
 */
export async function requireAdmin(request: NextRequest): Promise<null | NextResponse> {
  const csrf = enforceCsrf(request);
  if (csrf) return csrf;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // No-op — read only.
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: roleData, error: roleError } = await supabaseServer
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (roleError || !roleData?.role || roleData.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden — admin access required' }, { status: 403 });
  }

  return null; // no error
}

/**
 * Verify the caller is an authenticated user (any role).
 * Returns a NextResponse (401) on failure, or the user object on success.
 */
export async function requireUser(
  request: NextRequest
): Promise<null | { user: { id: string } } | NextResponse> {
  const csrf = enforceCsrf(request);
  if (csrf) return csrf;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // No-op — read only.
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return { user: { id: user.id } };
}
