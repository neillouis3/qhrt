import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

function isOpaqueApiKey(key: string): boolean {
  return key.startsWith('sb_publishable_') || key.startsWith('sb_secret_');
}

/**
 * New publishable/secret keys are random strings, not JWTs. supabase-js still
 * puts them in `Authorization: Bearer …`, and GoTrue rejects that as
 * "Invalid API key". Keep them on `apikey` only.
 */
export function fetchWithoutOpaqueBearer(apiKey: string): typeof fetch {
  return async (input, init) => {
    const headers = new Headers(init?.headers);
    if (isOpaqueApiKey(apiKey) && headers.get('Authorization') === `Bearer ${apiKey}`) {
      headers.delete('Authorization');
    }
    return fetch(input, { ...init, headers });
  };
}

export function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some((cookie) => cookie.name.includes('-auth-token'));
}

const publishableFetch = fetchWithoutOpaqueBearer(supabasePublishableKey);

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  global: { fetch: publishableFetch },
});

export const supabaseServer = supabaseSecretKey
  ? createClient(supabaseUrl, supabaseSecretKey, {
      global: { fetch: fetchWithoutOpaqueBearer(supabaseSecretKey) },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : (null as unknown as SupabaseClient);

type CookieToSet = {
  name: string;
  value: string;
  options?: object;
};

export function createRequestClient(
  request: NextRequest,
  setAll?: (cookies: CookieToSet[]) => void
): SupabaseClient {
  return createServerClient(supabaseUrl, supabasePublishableKey, {
    global: { fetch: publishableFetch },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies) {
        setAll?.(cookies);
      },
    },
  });
}

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
  return createRequestClient(request);
}
