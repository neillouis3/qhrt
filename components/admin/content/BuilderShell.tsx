import Link from 'next/link';
import type { ReactNode } from 'react';
import { Typography } from '@heroui/react';

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
        <div className="flex flex-col gap-4">
          <Link href={backHref} className="text-sm text-muted hover:text-foreground">
            ← {backLabel}
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
            <ol className="flex flex-wrap items-center gap-2">
              {steps.map((step, index) => {
                const active = step.key === currentStep;
                const reachable = index <= currentIndex;
                return (
                  <li key={step.key} className="flex items-center gap-2">
                    {index > 0 ? <span className="text-muted">/</span> : null}
                    {reachable ? (
                      <Link
                        href={step.href}
                        className={`text-sm ${active ? 'text-foreground' : 'text-muted hover:text-foreground'}`}
                      >
                        {index + 1}. {step.label}
                      </Link>
                    ) : (
                      <span className="text-sm text-muted">
                        {index + 1}. {step.label}
                      </span>
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
