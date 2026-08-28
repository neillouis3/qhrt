'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Navbar, { NavItem } from '@/components/Navbar';
import UserMenu from '@/components/UserMenu';
import SettingsModal from '@/components/SettingsModal';
import { useNavbarLinks } from '@/components/NavbarProvider';
import { useSession, clearSessionCache } from '@/hooks/useSession';

interface NavbarLayoutProps {
  children: React.ReactNode;
}

export default function NavbarLayout({ children }: NavbarLayoutProps) {
  const { adminLinks: ctxAdminLinks, userLinks: ctxUserLinks } = useNavbarLinks();
  const router = useRouter();
  const pathname = usePathname();
  const { session, loading, invalidate } = useSession();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const user = session
    ? {
        name: session.user.email ?? 'User',
        email: session.user.email ?? '',
        role: session.role ?? 'user',
      }
    : null;

  const handleLogout = async () => {
    // Close settings modal before logging out
    setSettingsOpen(false);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      clearSessionCache();
      invalidate();
      router.push('/');
    } catch (err) {
      // Even if the logout call fails, clear local state and navigate home.
      console.error('[NavbarLayout] Logout request failed:', err);
      clearSessionCache();
      invalidate();
      router.push('/');
    }
  };

  const isAdminRoute =
    (pathname?.startsWith('/dashboard') ||
      pathname?.startsWith('/content') ||
      pathname?.startsWith('/users') ||
      pathname?.startsWith('/analytics') ||
      pathname?.startsWith('/admin')) ??
    false;
  const isUserRoute = (pathname?.startsWith('/home') || pathname?.startsWith('/sessions')) ?? false;
  const isAuthRoute = pathname?.startsWith('/auth') ?? false;

  // Auth pages have their own layout, don't wrap them
  if (isAuthRoute) return <>{children}</>;

  // Determine which links to show based on user role and context
  let links: NavItem[] = [];
  if (user?.role === 'admin') {
    links = ctxAdminLinks ?? [];
  } else if (user) {
    links = ctxUserLinks ?? [];
  } else if (isUserRoute) {
    links = ctxUserLinks ?? [];
  }

  const rightContent = loading ? (
    <div className="w-20 h-8 animate-pulse rounded-full bg-accent-lighter dark:bg-navy-light" />
  ) : user ? (
    <UserMenu
      items={[
        { label: 'Settings', onClick: () => setSettingsOpen(true) },
        { label: 'Log out', onClick: handleLogout, danger: true },
      ]}
      initialEmail={user.email}
    />
  ) : (
    <div className="flex items-center gap-2">
      <a
        href="/auth/login"
        className="px-3 py-1.5 text-sm font-medium text-muted hover:text-navy dark:hover:text-white transition-colors"
      >
        Log in
      </a>
      <a
        href="/auth/login"
        className="px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-white hover:bg-primary-dark transition-colors dark:bg-primary-light dark:hover:bg-primary"
      >
        Sign up
      </a>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar logo="QHRT" logoHref="/" links={links} rightContent={rightContent} />
      <main className="flex flex-1 w-full">{children}</main>
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
