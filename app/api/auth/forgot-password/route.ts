import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '@/lib/rateLimiter';
import { apiError } from '@/lib/apiError';
import { fetchWithoutOpaqueBearer } from '@/lib/supabaseClient';

function appOrigin(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_APP_ORIGIN?.trim();
  if (configured) return configured.replace(/\/$/, '');
  return request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = await rateLimit(`${ip}:forgot-password`, 'auth');
  if (!rl.success) {
    const retryAfter = rl.reset ? Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000)) : 60;
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
    const supabase = createClient(supabaseUrl, publishableKey, {
      global: { fetch: fetchWithoutOpaqueBearer(publishableKey) },
    });

    const redirectTo = `${appOrigin(request)}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    if (error) {
      return apiError(error, '[api/auth/forgot-password] resetPasswordForEmail');
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists for that email, we sent a link to reset your password.',
    });
  } catch (err) {
    return apiError(err, '[api/auth/forgot-password] POST');
  }
}
