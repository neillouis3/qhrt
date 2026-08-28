'use client';

import Link from 'next/link';
import { useSession } from '@/hooks/useSession';

/**
 * Client component: the only part of the landing page that needs session state
 * (to swap the "Get started" CTA for "Go to your dashboard" when logged in).
 */
export default function LandingCta() {
  const { session } = useSession();
  const isLoggedIn = session !== null;

  const primaryClass =
    'inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-normal text-white transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2';
  const secondaryClass =
    'inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-normal text-foreground transition-opacity hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-muted focus:ring-offset-2';

  return (
    <div className="mt-10 flex items-center gap-2">
      {isLoggedIn ? (
        <Link href="/home" className={primaryClass}>
          Go to your dashboard
        </Link>
      ) : (
        <>
          <Link href="/auth/login" className={primaryClass}>
            Get started
          </Link>
          <Link href="/auth/login" className={secondaryClass}>
            Sign in
          </Link>
        </>
      )}
    </div>
  );
}
