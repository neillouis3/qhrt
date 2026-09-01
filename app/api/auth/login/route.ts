import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createRequestClient, supabaseServer } from '@/lib/supabaseClient';
import { rateLimit } from '@/lib/rateLimiter';

export async function POST(request: NextRequest) {
  // Rate limit auth attempts per IP to mitigate credential-stuffing / brute force.
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

    // Create a server client with getAll/setAll cookie handlers
    const supabase = createRequestClient(request, (cookies) => {
      cookies.forEach((cookie) => {
        response.cookies.set(cookie.name, cookie.value, cookie.options);
      });
    });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Fetch role from public.user_roles table using the user's UUID
    // Use maybeSingle instead of single to avoid errors when no role record exists
    const userId = data.user?.id;
    let role = 'user'; // default fallback

    if (userId) {
      const { data: roleData } = await supabaseServer
        .from('user_roles')
        .select('role', { count: 'none' })
        .eq('user_id', userId)
        .maybeSingle(); // won't throw if no match

      if (roleData?.role) {
        role = roleData.role;
      }
    }

    // Session cookies are written to `response` via setAll above
    return NextResponse.json({ user: data.user, role }, { status: 200, headers: response.headers });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
