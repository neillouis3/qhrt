import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createRequestClient, supabaseServer } from '@/lib/supabaseClient';
import { requireUser } from '@/lib/adminAuth';
import { rateLimit } from '@/lib/rateLimiter';
import { apiError } from '@/lib/apiError';

export async function DELETE(request: NextRequest) {
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
    const body = await request.json().catch(() => ({}));
    const password = typeof body.password === 'string' ? body.password : '';
    const confirmEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!password || !confirmEmail) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
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
    const email = user?.email?.trim().toLowerCase();
    if (!email || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (confirmEmail !== email) {
      return NextResponse.json({ error: 'Email does not match this account.' }, { status: 400 });
    }

    const { error: checkError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (checkError) {
      return NextResponse.json({ error: 'Password is incorrect.' }, { status: 401 });
    }

    const { error: deleteError } = await supabaseServer.auth.admin.deleteUser(user.id);
    if (deleteError) {
      return apiError(deleteError, '[api/settings/account] deleteUser');
    }

    await supabase.auth.signOut();
    return NextResponse.json({ success: true }, { status: 200, headers: response.headers });
  } catch (err) {
    return apiError(err, '[api/settings/account] DELETE');
  }
}
