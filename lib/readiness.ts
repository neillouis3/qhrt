import type { NextRequest } from 'next/server';
import type { AssessmentAnswers, AssessmentEvaluation } from '@/lib/assessments';

export const READINESS_COOKIE = 'qhrt_ready';
export const READINESS_TTL_SECONDS = 60 * 60 * 24 * 7;
export const READINESS_PATH = '/readiness';

export type ReadinessPass = {
  assessmentId: string;
  pathway: string;
  allowSignup: boolean;
  allowSessions: boolean;
  answers: AssessmentAnswers;
  evaluation: AssessmentEvaluation;
  exp: number;
};

const encoder = new TextEncoder();

function cookieSecret(): string {
  return (
    process.env.READINESS_COOKIE_SECRET?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    ''
  );
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export async function issueReadinessCookieValue(pass: Omit<ReadinessPass, 'exp'>): Promise<string | null> {
  const secret = cookieSecret();
  if (!secret) return null;
  const exp = Math.floor(Date.now() / 1000) + READINESS_TTL_SECONDS;
  const payload = JSON.stringify({ ...pass, exp });
  const sig = await hmacHex(secret, payload);
  return `${Buffer.from(payload, 'utf8').toString('base64url')}.${sig}`;
}

export async function readReadinessPass(request: NextRequest): Promise<ReadinessPass | null> {
  const secret = cookieSecret();
  const token = request.cookies.get(READINESS_COOKIE)?.value;
  if (!secret || !token) return null;

  const dot = token.indexOf('.');
  if (dot < 1) return null;
  const packed = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!/^[0-9a-f]+$/i.test(sig)) return null;

  let json: string;
  try {
    json = Buffer.from(packed, 'base64url').toString('utf8');
  } catch {
    return null;
  }

  const expected = await hmacHex(secret, json);
  if (expected.length !== sig.length) return null;
  if (!equalBytes(encoder.encode(expected.toLowerCase()), encoder.encode(sig.toLowerCase()))) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;
  if (typeof parsed.assessmentId !== 'string' || typeof parsed.pathway !== 'string') return null;
  const exp = typeof parsed.exp === 'number' ? parsed.exp : Number(parsed.exp);
  if (!Number.isFinite(exp) || exp * 1000 <= Date.now()) return null;
  if (parsed.allowSignup !== true) return null;
  if (!isRecord(parsed.answers) || !isRecord(parsed.evaluation)) return null;
  const allowSessions = parsed.allowSessions !== false;

  const answers: AssessmentAnswers = {};
  for (const [key, value] of Object.entries(parsed.answers)) {
    if (typeof value === 'string') answers[key] = value;
  }

  return {
    assessmentId: parsed.assessmentId,
    pathway: parsed.pathway,
    allowSignup: true,
    allowSessions,
    answers,
    evaluation: parsed.evaluation as unknown as AssessmentEvaluation,
    exp,
  };
}

export function readinessCookieOptions(): {
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
    maxAge: READINESS_TTL_SECONDS,
  };
}
