'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { buttonVariants } from '@heroui/react';
import Navbar, { NavItem } from '@/components/nav/Navbar';
import UserMenu from '@/components/nav/UserMenu';
import { useNavbarLinks } from '@/components/nav/NavbarProvider';
import { useLocale } from '@/context/LocaleContext';
import { usePublicNavLinks, useUserNavLinks } from '@/hooks/useAppNavLinks';
import { useSession } from '@/hooks/useSession';
import { logoutOnClient } from '@/lib/logoutClient';
import { isFocusSessionPath } from '@/lib/sessionUi';

interface NavbarLayoutProps {
  children: React.ReactNode;
}

export default function NavbarLayout({ children }: NavbarLayoutProps) {
  const { adminLinks: ctxAdminLinks } = useNavbarLinks();
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { session, loading, invalidate } = useSession();

  const userNavLinks = useUserNavLinks();
  const publicLinks = usePublicNavLinks();

  const user = session
    ? {
        name: session.user.email ?? 'User',
        email: session.user.email ?? '',
        role: session.role ?? 'user',
      }
    : null;

  const handleLogout = async () => {
    invalidate();
    try {
      await logoutOnClient();
    } catch (err) {
      console.error('[NavbarLayout] Logout request failed:', err);
    } finally {
      invalidate();
      router.push('/');
      router.refresh();
    }
  };

  const isUserRoute =
    (pathname?.startsWith('/home') ||
      pathname?.startsWith('/sessions') ||
      pathname?.startsWith('/assessments') ||
      pathname?.startsWith('/conversations') ||
      pathname?.startsWith('/journeys') ||
      pathname?.startsWith('/diary') ||
      pathname?.startsWith('/onboarding') ||
      pathname?.startsWith('/breathe') ||
      pathname?.startsWith('/settings')) ??
    false;
  const isAdminRoute =
    (pathname?.startsWith('/dashboard') ||
      pathname?.startsWith('/content') ||
      pathname?.startsWith('/users') ||
      pathname?.startsWith('/analytics')) ??
    false;
  const isAuthRoute =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/reset-password' ||
    (pathname?.startsWith('/auth') ?? false);
  const isFocusSession = isFocusSessionPath(pathname);
  const isOnboarding = pathname === '/onboarding';

  if (isAuthRoute || isFocusSession || isOnboarding) return <>{children}</>;

  let links: NavItem[] = publicLinks;
  if (isAdminRoute && user?.role === 'admin') {
    links = ctxAdminLinks ?? [];
  } else if (isUserRoute) {
    links = userNavLinks;
  }

  const isPublicPage = !isUserRoute && !isAdminRoute;
  const homeHref = user?.role === 'admin' ? '/dashboard' : '/home';
  const rightContent = (
    <div className="flex items-center gap-2">
      {loading ? (
        isPublicPage ? (
          <div className="h-8 w-36 animate-pulse rounded-lg bg-accent-lighter dark:bg-navy-light" />
        ) : (
          <div className="size-8 animate-pulse rounded-lg bg-accent-lighter dark:bg-navy-light" />
        )
      ) : user ? (
        isPublicPage ? (
          <Link href={homeHref} className={buttonVariants({ size: 'sm', variant: 'primary' })}>
            {t('nav.dashboard')}
          </Link>
        ) : (
          <UserMenu
            user={session?.user}
            onSettings={() => router.push('/settings')}
            onLogout={handleLogout}
          />
        )
      ) : (
        <>
          <Link href="/login" className={buttonVariants({ size: 'sm', variant: 'ghost' })}>
            {t('nav.login')}
          </Link>
          <Link href="/signup" className={buttonVariants({ size: 'sm', variant: 'primary' })}>
            {t('nav.signup')}
          </Link>
        </>
      )}
    </div>
  );

  const isHome = pathname === '/home';

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar logo="QHRT" logoHref="/" links={links} rightContent={rightContent} />
      <main className={`relative flex flex-1 w-full ${isHome ? 'overflow-x-clip' : ''}`}>{children}</main>
    </div>
  );
}
