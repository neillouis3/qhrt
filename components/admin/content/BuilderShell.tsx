import Link from 'next/link';
import type { ReactNode } from 'react';
import { Typography } from '@heroui/react';

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

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" aria-hidden>
      <path
        d="M6 3l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BuilderShell({
  backHref,
  backLabel,
  title,
  subtitle,
  steps,
  currentStep,
  actions,
  children,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  subtitle?: string;
  steps?: { key: string; label: string; href: string }[];
  currentStep?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const currentIndex = steps?.findIndex((step) => step.key === currentStep) ?? -1;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
        <div className="flex flex-col gap-5">
          <Link
            href={backHref}
            className="inline-flex w-fit items-center gap-1 text-sm text-muted hover:text-foreground"
          >
            <ChevronLeftIcon />
            {backLabel}
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-1">
              <Typography type="h3" weight="normal">
                {title}
              </Typography>
              {subtitle ? (
                <Typography type="body-sm" color="muted">
                  {subtitle}
                </Typography>
              ) : null}
            </div>
            {actions ? <div className="shrink-0">{actions}</div> : null}
          </div>
          {steps && steps.length > 0 ? (
            <ol className="flex flex-wrap items-center gap-1">
              {steps.map((step, index) => {
                const active = step.key === currentStep;
                const reachable = index <= currentIndex;
                return (
                  <li key={step.key} className="flex items-center gap-1">
                    {index > 0 ? (
                      <span className="text-muted">
                        <ChevronRightIcon />
                      </span>
                    ) : null}
                    {reachable ? (
                      <Link
                        href={step.href}
                        className={`text-sm ${active ? 'text-foreground' : 'text-muted hover:text-foreground'}`}
                      >
                        {step.label}
                      </Link>
                    ) : (
                      <span className="text-sm text-muted">{step.label}</span>
                    )}
                  </li>
                );
              })}
            </ol>
          ) : null}
        </div>
        {children}
      </div>
    </div>
  );
}
