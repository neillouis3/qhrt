'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import Logo from '@/components/ui/Logo';
import { AccountMenu } from '@/components/nav/UserMenu';

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" aria-hidden>
      <path
        d="M10 3 5 8l5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PracticeFocusShell({
  backHref,
  backLabel,
  children,
}: {
  backHref?: string;
  backLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative flex h-svh flex-col overflow-hidden bg-background">
      <header className="pointer-events-auto absolute inset-x-0 top-0 z-20 flex h-[var(--app-navbar-height)] items-center justify-between px-6">
        {backHref && backLabel ? (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
          >
            <ChevronLeftIcon />
            {backLabel}
          </Link>
        ) : (
          <Link href="/home" aria-label="QHRT home" className="flex items-center">
            <Logo decorative />
          </Link>
        )}
        <AccountMenu />
      </header>
      <div className="relative z-0 flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
