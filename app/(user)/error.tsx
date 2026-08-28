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
    console.error('User area error:', error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-6 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-8 py-16 text-center dark:border-emerald-900/60 dark:bg-emerald-950/30 max-w-md">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
          <svg
            className="h-7 w-7 text-emerald-600 dark:text-emerald-400"
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
          <h2 className="text-xl font-semibold text-emerald-900 dark:text-emerald-200">
            Something went wrong
          </h2>
          <p className="mt-2 text-sm text-emerald-700/80 dark:text-emerald-300/70">
            We couldn't load your space. Please try again.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-6 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-white px-6 text-sm font-semibold text-emerald-700 shadow-sm transition-all hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
