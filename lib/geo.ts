import type { NextRequest } from 'next/server';

/** ISO country we keep this program out of. */
export const BLOCKED_COUNTRY = 'CA';

export const GEO_COOKIE = 'qhrt_geo';
export const UNAVAILABLE_PATH = '/unavailable';
export const GEO_ACCESS_API = '/api/geo-access';
export const GEO_TTL_SECONDS = 60 * 60 * 24 * 14;

const encoder = new TextEncoder();

export function canadaGateMessage(): string {
  return 'QHRT is the United States program and is not offered in any Canadian province or territory.';
}

/**
 * Country for this request.
 *
 * Production (Vercel): `x-vercel-ip-country`. Cloudflare: `cf-ipcountry`.
 * Locally those headers are absent, so the gate does not fire unless
 * `GEO_FORCE_COUNTRY` is set (for example `CA` to preview the screen).
 *
 * Unknown / Tor (`XX`, `T1`) are treated as unblocked. IP geo can be wrong
 * and can be bypassed with a VPN. That is a limit of this approach, not a bug
 * in the cookie gate.
 */
export function requestCountry(request: NextRequest): string | null {
  const forced = process.env.GEO_FORCE_COUNTRY?.trim().toUpperCase();
  if (forced) return forced;

  const raw =
    request.headers.get('x-vercel-ip-country') ??
    request.headers.get('cf-ipcountry') ??
    request.headers.get('x-country-code');
  if (!raw) return null;

  const country = raw.trim().toUpperCase();
  if (!country || country === 'XX' || country === 'T1') return null;
  return country;
}

export function isGeoExemptPath(pathname: string): boolean {
  return (
    pathname === UNAVAILABLE_PATH ||
    pathname === `${UNAVAILABLE_PATH}/` ||
    pathname === GEO_ACCESS_API ||
    pathname.startsWith(`${GEO_ACCESS_API}/`)
  );
}

/** Same-origin relative path only. Blocks `//evil` open redirects. */
export function safeNextPath(raw: string | null | undefined): string {
  if (!raw) return '/';
  if (!raw.startsWith('/')) return '/';
  if (raw.startsWith('//') || raw.startsWith('/\\')) return '/';
  if (raw.includes('\\')) return '/';
  if (raw.startsWith(UNAVAILABLE_PATH)) return '/';
  return raw;
}

function accessSecret(): string {
  return process.env.GEO_ACCESS_CODE?.trim() ?? '';
}

function bytesToHex(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let out = '';
  for (const b of view) out += b.toString(16).padStart(2, '0');
  return out;
}

function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i]! ^ b[i]!;
  }
  return diff === 0;
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return bytesToHex(sig);
}

async function sha256(text: string): Promise<Uint8Array> {
  const buf = await crypto.subtle.digest('SHA-256', encoder.encode(text));
  return new Uint8Array(buf);
}

export async function verifyDeveloperCode(code: string): Promise<boolean> {
  const expected = accessSecret();
  if (!expected) return false;
  const provided = code.trim();
  if (!provided) return false;
  const [a, b] = await Promise.all([sha256(provided), sha256(expected)]);
  return equalBytes(a, b);
}

export async function issueGeoBypassValue(): Promise<string | null> {
  const secret = accessSecret();
  if (!secret) return null;
  const exp = Math.floor(Date.now() / 1000) + GEO_TTL_SECONDS;
  const sig = await hmacHex(secret, `qhrt-geo:${exp}`);
  return `${exp}.${sig}`;
}

export async function hasValidGeoBypass(request: NextRequest): Promise<boolean> {
  const secret = accessSecret();
  const token = request.cookies.get(GEO_COOKIE)?.value;
  if (!secret || !token) return false;

  const dot = token.indexOf('.');
  if (dot < 1) return false;
  const expRaw = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!/^\d+$/.test(expRaw) || !/^[0-9a-f]+$/i.test(sig)) return false;

  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp * 1000 <= Date.now()) return false;

  const expected = await hmacHex(secret, `qhrt-geo:${exp}`);
  if (expected.length !== sig.length) return false;
  return equalBytes(encoder.encode(expected.toLowerCase()), encoder.encode(sig.toLowerCase()));
}

export async function isCanadaBlocked(request: NextRequest): Promise<boolean> {
  if (requestCountry(request) !== BLOCKED_COUNTRY) return false;
  return !(await hasValidGeoBypass(request));
}

export function geoBypassCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax';
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: GEO_TTL_SECONDS,
  };
}
