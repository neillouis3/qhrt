'use client';

import { useEffect } from 'react';
import ErrorState from '@/components/layout/ErrorState';
import './globals.css';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        <div className="flex min-h-screen flex-col">
          <ErrorState
            title="Something went wrong"
            description="An unexpected error occurred. You can try again, or go back to the home page."
            onRetry={reset}
          />
        </div>
      </body>
    </html>
  );
}
