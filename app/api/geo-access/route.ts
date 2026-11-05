import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireCsrf } from '@/lib/csrf';
import {
  GEO_COOKIE,
  geoBypassCookieOptions,
  issueGeoBypassValue,
  verifyDeveloperCode,
} from '@/lib/geo';
import { rateLimit } from '@/lib/rateLimiter';

export async function POST(request: NextRequest) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = await rateLimit(`${ip}:geo-access`, 'auth');
  if (!rl.success) {
    return NextResponse.json({ error: 'Please wait a moment before trying again.' }, { status: 429 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'That code is not valid.' }, { status: 400 });
  }

  const code =
    raw && typeof raw === 'object' && 'code' in raw && typeof raw.code === 'string' ? raw.code : '';

  const ok = await verifyDeveloperCode(code);
  if (!ok) {
    return NextResponse.json({ error: 'That code is not valid.' }, { status: 403 });
  }

  const token = await issueGeoBypassValue();
  if (!token) {
    return NextResponse.json({ error: 'That code is not valid.' }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(GEO_COOKIE, token, geoBypassCookieOptions());
  return response;
}
