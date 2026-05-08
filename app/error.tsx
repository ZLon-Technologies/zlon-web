'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-5 text-center">
      <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-600">
        <svg
          className="h-10 w-10"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Something went wrong</h1>
      <p className="mt-2 text-base text-gray-500 max-w-xs">
        An unexpected error occurred. We apologize for the inconvenience.
      </p>
      <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
        <button
          onClick={() => reset()}
          className="w-full rounded-2xl bg-black py-4 font-semibold text-white transition-opacity hover:opacity-90"
        >
          Try Again
        </button>
        <Link
          href="/home"
          className="w-full rounded-2xl border border-gray-200 py-4 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
