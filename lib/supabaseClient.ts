import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// Client-side Supabase client (used in browser / client components)
export const supabase = createClient(supabaseUrl, supabasePublishableKey);

// Server-side Supabase client (used in API routes / server components)
// Guarded so it doesn't throw when the module is evaluated in the browser
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
export const supabaseServer = supabaseSecretKey
  ? createClient(supabaseUrl, supabaseSecretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : (null as unknown as SupabaseClient);

/**
 * Build a per-user, RLS-enforced Supabase client for the caller of an API route.
 *
 * Uses the PUBLISHABLE (anon) key plus the request's session cookies, so every
 * query is scoped by Postgres Row Level Security to the authenticated user
 * (`auth.uid()`). This is the Phase 6 enforcement path: user-scoped routes pass
 * this client into the engine libs instead of `supabaseServer`, so a route can
 * no longer read or write another user's rows even if it receives a foreign id.
 *
 * Admin routes intentionally keep using `supabaseServer` (service-role) for
 * cross-user management — that bypass is the documented design intent.
 */
export function createUserClient(request: NextRequest): SupabaseClient {
  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll().map((cookie) => ({
          name: cookie.name,
          value: cookie.value,
        }));
      },
      setAll() {
        // No-op — API routes never set session cookies.
      },
    },
  });
}
