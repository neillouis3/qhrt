'use client';

import { useEffect } from 'react';
import ErrorState from '@/components/layout/ErrorState';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin error:', error);
  }, [error]);

  return (
    <ErrorState
      title="Something went wrong"
      description="This page could not load. You can try again, or go back to the dashboard."
      onRetry={reset}
      homeHref="/dashboard"
      homeLabel="Dashboard"
    />
  );
}
