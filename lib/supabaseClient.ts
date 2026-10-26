import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';

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

function supabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
    secretKey: process.env.SUPABASE_SECRET_KEY ?? '',
  };
}

function requirePublicEnv() {
  const { url, publishableKey } = supabaseEnv();
  if (!url || !publishableKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required'
    );
  }
  return { url, publishableKey };
}

function lazyClient(create: () => SupabaseClient): SupabaseClient {
  let client: SupabaseClient | undefined;
  return new Proxy({} as SupabaseClient, {
    get(_target, prop, _receiver) {
      client ??= create();
      const value = Reflect.get(client, prop, client) as unknown;
      return typeof value === 'function' ? value.bind(client) : value;
    },
  });
}

/** Browser / publishable-key client. Created on first use so `next build` can import this module without env. */
export const supabase: SupabaseClient = lazyClient(() => {
  const { url, publishableKey } = requirePublicEnv();
  return createClient(url, publishableKey, {
    global: { fetch: fetchWithoutOpaqueBearer(publishableKey) },
  });
});

/** Service-role client. Created on first use. */
export const supabaseServer: SupabaseClient = lazyClient(() => {
  const { url, publishableKey, secretKey } = supabaseEnv();
  const key = secretKey || publishableKey;
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
  }
  return createClient(url, key, {
    global: { fetch: fetchWithoutOpaqueBearer(key) },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
});

type CookieToSet = {
  name: string;
  value: string;
  options?: object;
};

export function createRequestClient(
  request: NextRequest,
  setAll?: (cookies: CookieToSet[]) => void
): SupabaseClient {
  const { url, publishableKey } = requirePublicEnv();
  return createServerClient(url, publishableKey, {
    global: { fetch: fetchWithoutOpaqueBearer(publishableKey) },
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
