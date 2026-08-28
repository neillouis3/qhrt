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
    console.error('Admin error:', error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-6 rounded-2xl border border-amber-200 bg-amber-50/80 px-8 py-16 text-center dark:border-amber-900/60 dark:bg-amber-950/30 max-w-md">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
          <svg
            className="h-7 w-7 text-amber-600 dark:text-amber-400"
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
          <h2 className="text-xl font-semibold text-amber-900 dark:text-amber-200">
            Admin area unavailable
          </h2>
          <p className="mt-2 text-sm text-amber-700/80 dark:text-amber-300/70">
            There was a problem loading the admin panel. Please try again or contact support.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-amber-700 px-6 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:bg-amber-600 dark:hover:bg-amber-500"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-amber-300 bg-white px-6 text-sm font-semibold text-amber-700 shadow-sm transition-all hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/40"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
