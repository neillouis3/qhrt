import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createRequestClient, supabaseServer } from '@/lib/supabaseClient';
import { rateLimit } from '@/lib/rateLimiter';
import { signupClientMessage, supabaseKeysAreConfigured } from '@/lib/authErrors';

export async function POST(request: NextRequest) {
  // Rate limit signups per IP to mitigate account-enumeration / spam registration.
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = await rateLimit(ip, 'auth');
  if (!rl.success) {
    const retryAfter = rl.reset ? Math.max(0, Math.ceil((rl.reset - Date.now()) / 1000)) : 60;
    return NextResponse.json(
      { error: 'Too many attempts — please try again shortly' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (typeof password === 'string' && password.length < 6) {
      return NextResponse.json(
        { error: 'Password is too short. Use at least 6 characters.' },
        { status: 400 }
      );
    }

    if (!supabaseKeysAreConfigured()) {
      console.error(
        '[api/auth/signup] Missing or invalid Supabase keys in .env.local (publishable key should be a JWT or sb_publishable_…, secret key should be a JWT or sb_secret_…)'
      );
      return NextResponse.json(
        {
          error:
            'Auth is not configured. Add a real Supabase publishable key and secret key to .env.local, then restart the dev server.',
        },
        { status: 400 }
      );
    }

    // Create a response object to hold cookies and headers
    let response = NextResponse.json({});
    const supabase = createRequestClient(request, (cookies) => {
      cookies.forEach((cookie) => {
        response.cookies.set(cookie.name, cookie.value, cookie.options);
      });
    });

    // Create a confirmed user via the admin API so signup does not send a
    // confirmation email (Supabase's built-in mailer rate-limits quickly).
    const { data: created, error: createError } = await supabaseServer.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError || !created.user?.id) {
      const message = (createError?.message ?? '').toLowerCase();
      const alreadyExists =
        createError?.code === 'email_exists' ||
        createError?.code === 'user_already_exists' ||
        message.includes('already been registered') ||
        message.includes('already registered');

      if (!alreadyExists) {
        console.error('[api/auth/signup] createUser failed:', createError?.message, createError?.code);
        return NextResponse.json(
          { error: signupClientMessage(createError ?? { message: 'Signup failed' }) },
          { status: 400 }
        );
      }

      // Earlier signups may have created an unconfirmed user and then hit the
      // email rate limit. Confirm that account if the password matches.
      const signedIn = await supabase.auth.signInWithPassword({ email, password });
      if (signedIn.data.user) {
        return NextResponse.json({ user: signedIn.data.user }, { status: 201, headers: response.headers });
      }

      const notConfirmed =
        signedIn.error?.code === 'email_not_confirmed' ||
        (signedIn.error?.message ?? '').toLowerCase().includes('not confirmed');

      if (notConfirmed) {
        const { data: listed } = await supabaseServer.auth.admin.listUsers({ perPage: 1000, page: 1 });
        const existing = listed.users.find(
          (user) => user.email?.toLowerCase() === String(email).toLowerCase()
        );
        if (existing) {
          await supabaseServer.auth.admin.updateUserById(existing.id, { email_confirm: true });
          const retry = await supabase.auth.signInWithPassword({ email, password });
          if (retry.data.user) {
            return NextResponse.json({ user: retry.data.user }, { status: 201, headers: response.headers });
          }
        }
      }

      return NextResponse.json(
        { error: 'An account with this email already exists. Sign in instead.' },
        { status: 400 }
      );
    }

    const userId = created.user.id;

    await supabaseServer.from('user_roles').insert({ user_id: userId, role: 'user' });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      console.error('[api/auth/signup] signIn after create failed:', error?.message, error?.code);
      return NextResponse.json(
        { error: 'Account created. Sign in to continue.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ user: data.user }, { status: 201, headers: response.headers });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
