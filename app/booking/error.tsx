'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Booking page error:', error);
  }, [error]);

  return (
    <div className="flex h-[50vh] flex-col items-center justify-center px-4 text-center">
      <h2 className="text-xl font-bold text-gray-900">Something went wrong!</h2>
      <p className="mt-2 text-sm text-gray-500">
        We encountered an error while loading your booking details.
      </p>
      <div className="mt-6 flex gap-4">
        <button
          onClick={() => reset()}
          className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Try again
        </button>
        <Link
          href="/home"
          className="rounded-full border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
}
