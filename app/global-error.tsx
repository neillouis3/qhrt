'use client';

import { useEffect } from 'react';

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
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-6 rounded-2xl border border-red-200 bg-red-50/80 px-8 py-16 text-center dark:border-red-900/60 dark:bg-red-950/30 max-w-md">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
          <svg
            className="h-7 w-7 text-red-600 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-red-900 dark:text-red-200">
            Something went wrong
          </h2>
          <p className="mt-2 text-sm text-red-700/80 dark:text-red-300/70">
            An unexpected error occurred. Please try again.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:bg-primary-light dark:hover:bg-primary"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-6 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-muted/5 focus:outline-none focus:ring-2 focus:ring-muted focus:ring-offset-2 dark:border-navy dark:bg-navy dark:text-muted dark:hover:bg-navy-light/20"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
