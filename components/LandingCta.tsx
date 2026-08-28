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

  return (
    <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
      {isLoggedIn ? (
        <Link
          href="/home"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition-all duration-200 hover:bg-primary-dark hover:shadow-md hover:shadow-primary/30 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:bg-primary-light dark:hover:bg-primary"
        >
          Go to your dashboard
        </Link>
      ) : (
        <>
          <Link
            href="/auth/login"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition-all duration-200 hover:bg-primary-dark hover:shadow-md hover:shadow-primary/30 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:bg-primary-light dark:hover:bg-primary"
          >
            Get started
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-border bg-white px-8 text-sm font-semibold text-navy-light transition-all duration-200 hover:border-muted hover:bg-muted/5 focus:outline-none focus:ring-2 focus:ring-muted focus:ring-offset-2 dark:border-navy dark:bg-navy dark:text-muted dark:hover:border-muted dark:hover:bg-navy-light/20"
          >
            Learn more
          </Link>
        </>
      )}
    </div>
  );
}
