'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@heroui/react';
import Logo from '@/components/ui/Logo';
import ThemeSwitcher from '@/components/nav/ThemeSwitcher';

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
  extras,
  children,
}: {
  backHref?: string;
  backLabel?: string;
  extras?: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="relative flex h-svh overflow-hidden bg-background">
      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-4 sm:px-6">
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
        <div className="flex items-center gap-1">
          {extras}
          <ThemeSwitcher />
          <Button size="sm" variant="ghost" onPress={() => router.push('/home')}>
            Close
          </Button>
        </div>
      </header>
      <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
