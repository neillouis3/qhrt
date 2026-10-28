'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Button, Typography } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { PauseIcon } from '@hugeicons/core-free-icons';
import Logo from '@/components/ui/Logo';
import ThemeSwitcher from '@/components/nav/ThemeSwitcher';

function FadeScroll({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-0 flex-1">
      <div className="progress-rail-scroll">{children}</div>
    </div>
  );
}

function PauseButton({ onPause }: { onPause: () => void }) {
  return (
    <Button size="sm" variant="ghost" onPress={onPause}>
      <HugeiconsIcon icon={PauseIcon} size={16} strokeWidth={1.5} />
      Pause
    </Button>
  );
}

function SidebarBody({
  progressLabel,
  progress,
  showTheme,
  onPause,
}: {
  progressLabel: string;
  progress: ReactNode;
  showTheme: boolean;
  onPause?: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <Link
        href="/home"
        aria-label="QHRT home"
        className="flex w-fit shrink-0 items-center text-foreground transition-opacity hover:opacity-70"
      >
        <Logo decorative />
      </Link>
      <nav aria-label={progressLabel} className="flex min-h-0 flex-1 flex-col justify-center">
        <div className="flex h-[75%] min-h-0 flex-col gap-3">
          <Typography type="body-xs" color="muted" className="shrink-0">
            {progressLabel}
          </Typography>
          <FadeScroll>{progress}</FadeScroll>
        </div>
      </nav>
      {onPause || showTheme ? (
        <div className="flex shrink-0 items-center gap-1 pt-6">
          {onPause ? <PauseButton onPause={onPause} /> : null}
          {showTheme ? (
            <div className="ml-auto">
              <ThemeSwitcher />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function FocusSessionLayout({
  progressLabel = 'Your progress',
  progress,
  title,
  subtitle,
  actions,
  leadingActions,
  onPause,
  contentAlign = 'center',
  children,
}: {
  progressLabel?: string;
  progress: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  leadingActions?: ReactNode;
  onPause?: () => void;
  contentAlign?: 'center' | 'start';
  children: ReactNode;
}) {
  const [progressOpen, setProgressOpen] = useState(false);

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      <aside className="hidden h-full w-72 shrink-0 flex-col px-5 py-6 lg:flex">
        <SidebarBody progressLabel={progressLabel} progress={progress} showTheme onPause={onPause} />
      </aside>

      {progressOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close progress"
            className="absolute inset-0 bg-foreground/20"
            onClick={() => setProgressOpen(false)}
          />
          <aside className="relative flex h-full w-72 flex-col bg-background px-5 py-6">
            <div className="mb-4 flex justify-end">
              <Button size="sm" variant="ghost" onPress={() => setProgressOpen(false)}>
                Close
              </Button>
            </div>
            <SidebarBody progressLabel={progressLabel} progress={progress} showTheme={false} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 lg:hidden">
          <Link href="/home" aria-label="QHRT home" className="flex items-center">
            <Logo decorative />
          </Link>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onPress={() => setProgressOpen(true)}>
              Progress
            </Button>
            {onPause ? <PauseButton onPause={onPause} /> : null}
            <ThemeSwitcher />
          </div>
        </header>

        <main
          className={`flex min-h-0 flex-1 flex-col overflow-y-auto px-4 sm:px-8 lg:px-12 ${
            contentAlign === 'start' ? 'pt-28 pb-12 lg:pt-40 lg:pb-16' : 'py-8 lg:py-10'
          }`}
        >
          <div
            className={`mx-auto flex w-full max-w-2xl flex-col gap-8 ${
              contentAlign === 'start' ? 'justify-start' : 'min-h-full justify-center'
            }`}
          >
            {title ? (
              <div className="flex flex-col gap-1">
                <Typography type="h3" weight="normal">
                  {title}
                </Typography>
                {subtitle ? (
                  <Typography type="body-sm" color="muted">
                    {subtitle}
                  </Typography>
                ) : null}
              </div>
            ) : null}
            <div className="flex flex-col gap-6">{children}</div>
            {leadingActions || actions ? (
              <div className="flex w-full flex-wrap items-center gap-2">
                {leadingActions ? (
                  <div className="flex items-center gap-2">{leadingActions}</div>
                ) : null}
                {actions ? (
                  <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                    {actions}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
