'use client';

import Link from 'next/link';
import { buttonVariants } from '@heroui/react';
import { useSession } from '@/hooks/useSession';

/** Primary actions on the marketing home when logged out. */
export function LandingCta() {
  const { session } = useSession();
  if (session !== null) return null;

  return (
    <div className="flex items-center gap-2">
      <Link href="/signup" className={buttonVariants({ size: 'sm', variant: 'primary' })}>
        Get started
      </Link>
      <Link href="/login" className={buttonVariants({ size: 'sm', variant: 'outline' })}>
        Sign in
      </Link>
    </div>
  );
}

/** 404 page actions based on session. */
export function NotFoundCta() {
  const { session, loading } = useSession();

  if (loading) {
    return <div className="h-8 w-24 animate-pulse rounded-lg bg-accent-lighter dark:bg-navy-light" />;
  }

  if (session) {
    const href = session.role === 'admin' ? '/dashboard' : '/home';
    const label = session.role === 'admin' ? 'Go to dashboard' : 'Go to home';
    return (
      <Link href={href} className={buttonVariants({ size: 'sm', variant: 'primary' })}>
        {label}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/" className={buttonVariants({ size: 'sm', variant: 'primary' })}>
        Go home
      </Link>
      <Link href="/login" className={buttonVariants({ size: 'sm', variant: 'outline' })}>
        Log in
      </Link>
    </div>
  );
}
