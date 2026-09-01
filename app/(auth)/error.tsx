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
    console.error('Auth error:', error);
  }, [error]);

  return (
    <ErrorState
      title="Something went wrong"
      description="Sign in could not finish. You can try again, or go back to the login page."
      onRetry={reset}
      homeHref="/login"
      homeLabel="Back to login"
    />
  );
}
