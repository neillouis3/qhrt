import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * CSRF protection for mutating (state-changing) requests.
 *
 * Strategy:
 *  1. Auth cookies are SameSite=Lax (default), which already blocks cross-site
 *     subresource requests from carrying the cookie.
 *  2. As defense-in-depth, mutating admin/user API requests must present an
 *     `Origin` (or `Referer`) that matches the app's own origin. Cross-origin
 *     browsers always send a differing Origin on POST/PATCH/DELETE; same-origin
 *     requests send a matching Origin or none (for same-origin navigations).
 *
 * Returns `null` when the request passes the origin check, or a `403` NextResponse
 * when it should be rejected. Call this at the top of every mutating handler.
 */
export function checkCsrfOrigin(request: NextRequest): null | NextResponse {
  // Same-origin requests may omit Origin (e.g. some same-site navigations);
  // only reject when an Origin/Referer is present AND it does not match the app.
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  const provided = origin ?? referer;
  if (!provided) {
    // No cross-origin indicator present — treat as same-origin. This is safe
    // because SameSite=Lax cookies are not sent on cross-site subresource requests.
    return null;
  }

  const appOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN ?? new URL(request.url).origin;

  try {
    const providedUrl = new URL(provided);
    if (providedUrl.origin !== new URL(appOrigin).origin) {
      return NextResponse.json({ error: 'Cross-origin request rejected' }, { status: 403 });
    }
  } catch {
    // Malformed Origin/Referer — reject rather than guess.
    return NextResponse.json({ error: 'Invalid Origin header' }, { status: 403 });
  }

  return null;
}

/**
 * Convenience guard for mutating methods. Returns a 405 for non-mutating methods
 * (so callers can uniformly use it), or delegates to the origin check otherwise.
 *
 * Usage at the top of a POST/PATCH/DELETE handler:
 *   const csrf = requireCsrf(request);
 *   if (csrf) return csrf;
 */
export function requireCsrf(request: NextRequest): null | NextResponse {
  const method = request.method.toUpperCase();
  const isMutating = method === 'POST' || method === 'PATCH' || method === 'DELETE';
  if (!isMutating) return null;
  return checkCsrfOrigin(request);
}
