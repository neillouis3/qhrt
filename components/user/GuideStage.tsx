'use client';

import type { ReactNode } from 'react';
import { Typography } from '@heroui/react';

export function GuideStage({
  kicker,
  title,
  prompt,
  fill,
  remaining,
  waiting,
  action,
  extra,
  children,
}: {
  kicker: string;
  title: string;
  prompt: string;
  fill: number;
  remaining: number;
  waiting: boolean;
  action: ReactNode;
  extra?: ReactNode;
  children: ReactNode;
}) {
  const progress = waiting ? 1 : fill;
  return (
    <main className="relative z-10 mx-auto flex min-h-0 w-full max-w-sm flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <div className="flex w-full flex-col items-center gap-5">
        <div className="flex flex-col gap-1">
          <Typography type="body-xs" color="muted">
            {kicker}
          </Typography>
          <Typography type="h3" weight="normal">
            {title}
          </Typography>
          {prompt ? (
            <Typography type="body-sm" color="muted">
              {prompt}
            </Typography>
          ) : null}
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="relative flex size-[min(48vmin,15rem)] items-center justify-center text-foreground">
            <svg viewBox="0 0 120 120" className="absolute inset-0" aria-hidden>
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.12"
                strokeWidth="1.5"
              />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.55"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray={`${Math.PI * 2 * 54}`}
                strokeDashoffset={`${Math.PI * 2 * 54 * (1 - progress)}`}
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div className="flex size-[58%] items-center justify-center overflow-hidden [&>svg]:block">
              {children}
            </div>
          </div>
          <Typography type="body-sm" color="muted" className="tabular-nums">
            {waiting ? 0 : remaining}
          </Typography>
        </div>

        {extra}
        {action}
      </div>
    </main>
  );
}
