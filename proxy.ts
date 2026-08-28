import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { supabaseServer } from '@/lib/supabaseClient';

export async function proxy(request: NextRequest) {
  // Skip API routes - they handle their own auth
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

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
          // No-op in proxy — cookies are read-only here
        },
      },
    }
  );

  // Verify the user's session via Supabase JWT (server-side)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAdminRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/content') ||
    pathname.startsWith('/users') ||
    pathname.startsWith('/analytics');
  const isUserRoute = pathname.startsWith('/home') || pathname.startsWith('/sessions');
  const isAuthRoute = pathname.startsWith('/auth');

  const isAuthenticated = !error && !!user;
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
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/home', request.url));
    }
  }

  // Protect user routes
  if (isUserRoute) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Admins get redirected to dashboard
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && isAuthenticated) {
    const redirectUrl = role === 'admin' ? '/dashboard' : '/home';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image).*)',
    '/dashboard/:path*',
    '/content/:path*',
    '/users/:path*',
    '/analytics/:path*',
    '/home/:path*',
    '/sessions/:path*',
    '/auth/:path*',
  ],
};

// Alias for backwards compatibility just in case because middleware convention is now deprecated.
export const middleware = proxy;
