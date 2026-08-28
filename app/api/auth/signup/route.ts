import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { supabaseServer } from '@/lib/supabaseClient';
import { rateLimit } from '@/lib/rateLimiter';

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

    // Create a response object to hold cookies and headers
    let response = NextResponse.json({});
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll().map((cookie) => ({
              name: cookie.name,
              value: cookie.value,
            }));
          },
          setAll(cookies) {
            cookies.forEach((cookie) => {
              response.cookies.set({ name: cookie.name, value: cookie.value, ...cookie.options });
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: 'Signup failed. Please try again.' }, { status: 400 });
    }

    // Insert the user's role into the public.user_roles table
    // Default new signups to 'user' role
    if (data.user?.id) {
      await supabaseServer
        .from('user_roles')
        .insert({ user_id: data.user.id, role: 'user' })
        .select()
        .single();
    }

    return NextResponse.json({ user: data.user }, { status: 201, headers: response.headers });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
