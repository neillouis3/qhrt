import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createRequestClient } from '@/lib/supabaseClient';
import { requireUser } from '@/lib/adminAuth';
import { rateLimit } from '@/lib/rateLimiter';
import { apiError } from '@/lib/apiError';

export async function POST(request: NextRequest) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = await rateLimit(`${ip}:${userResult.user.id}`, 'auth');
  if (!rl.success) {
    const retryAfter = rl.reset ? Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000)) : 60;
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  try {
    const body = await request.json();
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new password are required.' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters.' }, { status: 400 });
    }
    if (currentPassword === newPassword) {
      return NextResponse.json({ error: 'Choose a different password.' }, { status: 400 });
    }

    let response = NextResponse.json({ success: true });
    const supabase = createRequestClient(request, (cookies) => {
      cookies.forEach((cookie) => {
        response.cookies.set(cookie.name, cookie.value, cookie.options);
      });
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const email = user?.email;
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error: checkError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (checkError) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      if (updateError.message?.toLowerCase().includes('weak')) {
        return NextResponse.json({ error: 'New password must be at least 6 characters.' }, { status: 400 });
      }
      return apiError(updateError, '[api/settings/password] updateUser');
    }

    return NextResponse.json({ success: true }, { status: 200, headers: response.headers });
  } catch (err) {
    return apiError(err, '[api/settings/password] POST');
  }
}
