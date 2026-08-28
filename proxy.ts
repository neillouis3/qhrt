import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  createRequestClient,
  hasSupabaseAuthCookie,
  supabaseServer,
} from '@/lib/supabaseClient';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes and static files — they don't need session checks.
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    /\.(?:ico|png|jpg|jpeg|svg|webp|gif|txt|woff2?)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const isAdminRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/content') ||
    pathname.startsWith('/users') ||
    pathname.startsWith('/analytics');
  const isUserRoute =
    pathname.startsWith('/home') ||
    pathname.startsWith('/sessions') ||
    pathname.startsWith('/assessments') ||
    pathname.startsWith('/conversations') ||
    pathname.startsWith('/journeys') ||
    pathname.startsWith('/diary') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/breathe');
  const isSettingsRoute = pathname.startsWith('/settings');
  const isAuthRoute =
    pathname === '/login' || pathname === '/signup' || pathname === '/reset-password';

  if (!isAdminRoute && !isUserRoute && !isSettingsRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createRequestClient(request, (cookies) => {
    cookies.forEach(({ name, value }) => request.cookies.set(name, value));
    response = NextResponse.next({ request });
    cookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });
  });

  const user = hasSupabaseAuthCookie(request)
    ? (await supabase.auth.getUser()).data.user
    : null;
  const isAuthenticated = !!user;
  const needsRole =
    (isAdminRoute && isAuthenticated) ||
    (isUserRoute && isAuthenticated) ||
    (isAuthRoute && isAuthenticated);

  // Fetch role from public.user_roles table (server-side verified) — at most once per request
  let role: string | null = null;
  if (needsRole && user) {
    const { data: roleData } = await supabaseServer
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    role = roleData?.role ?? null;
  }

  // Protect admin routes
  if (isAdminRoute) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/home', request.url));
    }
  }

  // Protect user routes
  if (isUserRoute) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Admins get redirected to dashboard
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (pathname === '/onboarding' && user) {
      const { data: progress } = await supabaseServer
        .from('user_progress')
        .select('intake_completed')
        .eq('user_id', user.id)
        .maybeSingle();

      if (progress?.intake_completed) {
        return NextResponse.redirect(new URL('/home', request.url));
      }
    }
  }

  if (isSettingsRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && isAuthenticated) {
    if (pathname === '/reset-password') {
      return response;
    }
    if (pathname === '/login' || role === 'admin') {
      const redirectUrl = role === 'admin' ? '/dashboard' : '/home';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    const { data: progress } = await supabaseServer
      .from('user_progress')
      .select('intake_completed')
      .eq('user_id', user.id)
      .maybeSingle();

    if (progress?.intake_completed) {
      return NextResponse.redirect(new URL('/home', request.url));
    }

    return response;
  }

  return response;
}

export const config = {
  matcher: [
    '/home/:path*',
    '/dashboard/:path*',
    '/content/:path*',
    '/users/:path*',
    '/analytics/:path*',
    '/sessions/:path*',
    '/assessments/:path*',
    '/conversations/:path*',
    '/journeys/:path*',
    '/diary/:path*',
    '/breathe',
    '/breathe/:path*',
    '/onboarding',
    '/settings/:path*',
    '/login',
    '/signup',
    '/reset-password',
  ],
};

// Alias for backwards compatibility just in case because middleware convention is now deprecated.
export const middleware = proxy;
