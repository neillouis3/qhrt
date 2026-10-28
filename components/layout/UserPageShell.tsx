import type { ReactNode } from 'react';
import { Typography } from '@heroui/react';

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
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
  );
}

export default function UserPageShell({
  children,
  wide = false,
  align = 'center',
  transparentBg = false,
}: {
  children: React.ReactNode;
  wide?: boolean | '6xl' | 'full' | '75';
  align?: 'center' | 'start';
  /** Lets a page-level ambient background show through (Home). */
  transparentBg?: boolean;
}) {
  const centeredWidth =
    wide === 'full'
      ? 'max-w-none'
      : wide === '75'
        ? 'w-full max-w-none lg:w-[75%]'
        : wide === '6xl'
          ? 'max-w-6xl lg:w-[80%] lg:max-w-6xl'
          : wide
            ? 'max-w-5xl lg:w-[80%] lg:max-w-5xl'
            : 'max-w-3xl lg:w-[60%] lg:max-w-none';
  const startWidth =
    wide === 'full'
      ? 'max-w-none'
      : wide === '75'
        ? 'w-full max-w-none lg:w-[75%]'
        : wide === '6xl'
          ? 'max-w-6xl'
          : wide
            ? 'max-w-5xl'
            : 'max-w-3xl';

  return (
    <div
      className={`flex flex-1 flex-col ${transparentBg ? 'bg-transparent' : 'bg-background'} ${align === 'center' ? 'items-center' : 'items-start'}`}
    >
      <div
        className={`flex w-full flex-1 flex-col gap-10 px-6 py-12 ${align === 'start' ? startWidth : centeredWidth}`}
      >
        {children}
      </div>
    </div>
  );
}
