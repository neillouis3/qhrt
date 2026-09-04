'use client';

import Link from 'next/link';
import { Button, buttonVariants, Typography } from '@heroui/react';
import Logo from '@/components/ui/Logo';

interface ErrorStateProps {
  title: string;
  description: string;
  onRetry?: () => void;
  homeHref?: string;
  homeLabel?: string;
}

export default function ErrorState({
  title,
  description,
  onRetry,
  homeHref = '/',
  homeLabel = 'Go home',
}: ErrorStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center bg-background">
      <div className="flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-24 lg:w-[60%] lg:max-w-none">
        <div className="flex max-w-xl flex-col gap-8">
          <Logo decorative className="h-14 w-14" />
          <div className="flex flex-col gap-4">
            <Typography type="h1" weight="normal">
              {title}
            </Typography>
            <Typography type="body" color="muted">
              {description}
            </Typography>
          </div>
          <div className="flex items-center gap-2">
            {onRetry ? (
              <Button size="sm" variant="primary" onPress={onRetry}>
                Try again
              </Button>
            ) : null}
            <Link
              href={homeHref}
              className={buttonVariants({
                size: 'sm',
                variant: onRetry ? 'outline' : 'primary',
              })}
            >
              {homeLabel}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
