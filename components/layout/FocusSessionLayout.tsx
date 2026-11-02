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
      <div className="flex h-[var(--app-navbar-height)] shrink-0 items-center px-6">
        <Link
          href="/home"
          aria-label="QHRT home"
          className="flex items-center text-foreground transition-opacity hover:opacity-70"
        >
          <Logo decorative />
        </Link>
      </div>
      <nav aria-label={progressLabel} className="flex min-h-0 flex-1 flex-col justify-center px-5">
        <div className="flex h-[75%] min-h-0 flex-col gap-3">
          <Typography type="body-xs" color="muted" className="shrink-0">
            {progressLabel}
          </Typography>
          <FadeScroll>{progress}</FadeScroll>
        </div>
      </nav>
      {onPause || showTheme ? (
        <div className="flex shrink-0 items-center gap-1 px-5 pb-6 pt-6">
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
  wide = false,
  immersive = false,
  showTheme = true,
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
  wide?: boolean;
  /** Hides the progress rail and floats the actions over a full-screen slide. */
  immersive?: boolean;
  showTheme?: boolean;
  children: ReactNode;
}) {
  const [progressOpen, setProgressOpen] = useState(false);

  return (
    <div className={`relative flex h-svh overflow-hidden bg-background ${immersive ? 'w-full' : ''}`}>
      {immersive ? null : (
      <aside className="hidden h-full w-72 shrink-0 flex-col lg:flex">
        <SidebarBody progressLabel={progressLabel} progress={progress} showTheme={showTheme} onPause={onPause} />
      </aside>
      )}

      {progressOpen && !immersive ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close progress"
            className="absolute inset-0 bg-foreground/20"
            onClick={() => setProgressOpen(false)}
          />
          <aside className="relative flex h-full w-72 flex-col bg-background">
            <div className="flex h-[var(--app-navbar-height)] items-center justify-end px-6">
              <Button size="sm" variant="ghost" onPress={() => setProgressOpen(false)}>
                Close
              </Button>
            </div>
            <SidebarBody progressLabel={progressLabel} progress={progress} showTheme={false} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className={`flex h-[var(--app-navbar-height)] shrink-0 items-center justify-between gap-3 px-6 lg:hidden ${immersive ? 'hidden' : ''}`}>
          <Link href="/home" aria-label="QHRT home" className="flex items-center">
            <Logo decorative />
          </Link>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onPress={() => setProgressOpen(true)}>
              Progress
            </Button>
            {onPause ? <PauseButton onPause={onPause} /> : null}
            {showTheme ? <ThemeSwitcher /> : null}
          </div>
        </header>

        <main
          className={
            immersive
              ? 'grid min-h-0 flex-1 place-items-center overflow-hidden px-8 py-24'
              : `flex min-h-0 flex-1 flex-col overflow-y-auto px-4 sm:px-8 lg:px-12 ${
                  contentAlign === 'start' ? 'pt-28 pb-12 lg:pt-40 lg:pb-16' : 'py-8 lg:py-10'
                }`
          }
        >
          <div
            className={
              immersive
                ? 'w-[min(88vw,calc((100svh_-_12rem)*16/9))] shrink-0'
                : `mx-auto flex w-full flex-col gap-8 ${wide ? 'max-w-5xl' : 'max-w-2xl'} ${
                    contentAlign === 'start' ? 'justify-start' : 'min-h-full justify-center'
                  }`
            }
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
            {!immersive && (leadingActions || actions) ? (
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
      {immersive && (leadingActions || actions) ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex justify-center px-4">
          <div className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-border bg-background/95 px-3 py-2 shadow-[0_16px_40px_-18px_rgba(15,23,42,0.45)] backdrop-blur">
            {leadingActions}
            {actions}
          </div>
        </div>
      ) : null}
    </div>
  );
}
