import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  canadaGateMessage,
  isCanadaBlocked,
  isGeoExemptPath,
  safeNextPath,
  UNAVAILABLE_PATH,
} from '@/lib/geo';
import {
  isProgramSessionApi,
  isProgramSessionPath,
  accessHoldTarget,
  pathwayHoldResponse,
} from '@/lib/pathway';
import { READINESS_PATH, readReadinessPass } from '@/lib/readiness';
import {
  createRequestClient,
  hasSupabaseAuthCookie,
  supabaseServer,
} from '@/lib/supabaseClient';

async function heldSessionResponse(userId: string, role: string | null, request: NextRequest) {
  const target = await accessHoldTarget(userId, role);
  if (!target) return null;
  if (request.nextUrl.pathname.startsWith('/api/')) {
    if (target === READINESS_PATH) {
      return NextResponse.json(
        { error: 'Complete the program readiness check first.', code: 'READINESS_REQUIRED' },
        { status: 403 }
      );
    }
    return pathwayHoldResponse();
  }
  return NextResponse.redirect(new URL(target, request.url));
}

function canadaUnavailableRedirect(request: NextRequest) {
  const dest = request.nextUrl.clone();
  dest.pathname = UNAVAILABLE_PATH;
  dest.search = '';
  const next = safeNextPath(`${request.nextUrl.pathname}${request.nextUrl.search}`);
  if (next !== '/') dest.searchParams.set('next', next);
  const response = NextResponse.redirect(dest);
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const blockedInCanada = await isCanadaBlocked(request);

  if (pathname === '/robots.txt') {
    if (blockedInCanada) {
      return new NextResponse('User-agent: *\nDisallow: /\n', {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Robots-Tag': 'noindex, nofollow',
        },
      });
    }
    return NextResponse.next();
  }

  if (
    pathname.startsWith('/_next/') ||
    /\.(?:ico|png|jpg|jpeg|svg|webp|gif|txt|woff2?)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  if (blockedInCanada && !isGeoExemptPath(pathname)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: canadaGateMessage() }, { status: 403 });
    }
    return canadaUnavailableRedirect(request);
  }

  // Skip API routes and static files — they don't need session checks.
  if (pathname.startsWith('/api/')) {
    if (isProgramSessionApi(pathname) && hasSupabaseAuthCookie(request)) {
      const apiClient = createRequestClient(request);
      const apiUser = (await apiClient.auth.getUser()).data.user;
      if (apiUser) {
        const { data: roleData } = await supabaseServer
          .from('user_roles')
          .select('role')
          .eq('user_id', apiUser.id)
          .maybeSingle();
        const held = await heldSessionResponse(apiUser.id, roleData?.role ?? null, request);
        if (held) return held;
      }
    }
    return NextResponse.next();
  }

  const isAdminRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/content') ||
    pathname.startsWith('/users') ||
    pathname.startsWith('/analytics');
  const isUserRoute =
    pathname.startsWith('/home') ||
    pathname.startsWith('/assessments') ||
    pathname.startsWith('/diary') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/starting-out') ||
    pathname.startsWith('/modules') ||
    pathname.startsWith('/breathe') ||
    pathname.startsWith('/wind-down') ||
    pathname.startsWith('/pause') ||
    pathname.startsWith('/practice') ||
    pathname.startsWith('/starting-point') ||
    pathname.startsWith('/reflection');
  const isSettingsRoute = pathname.startsWith('/settings');
  const isAuthRoute =
    pathname === '/login' || pathname === '/signup' || pathname === '/reset-password';

  if (pathname === '/signup' && !hasSupabaseAuthCookie(request)) {
    const pass = await readReadinessPass(request);
    if (!pass) return NextResponse.redirect(new URL(READINESS_PATH, request.url));
  }

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

    if (user && isProgramSessionPath(pathname)) {
      const held = await heldSessionResponse(user.id, role, request);
      if (held) return held;
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

// Alias for backwards compatibility just in case because middleware convention is now deprecated.
export const middleware = proxy;
