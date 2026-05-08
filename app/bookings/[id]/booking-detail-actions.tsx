'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { cancelBooking } from '../../booking/actions';

interface BookingDetailActionsProps {
  bookingId: string;
}

export function BookingDetailActions({ bookingId }: BookingDetailActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleCancelBooking() {
    if (isPending) {
      return;
    }

    startTransition(async () => {
      const result = await cancelBooking(bookingId);

      if (result.ok) {
        router.replace('/bookings');
        router.refresh();
        return;
      }

      setMessage(result.message);
    });
  }

  return (
    <div className="space-y-3">
      <Link
        prefetch={false}
        href={`/bookings/${bookingId}/reschedule`}
        className="flex w-full items-center justify-center rounded-full border border-black/15 bg-white px-5 py-4 text-base font-semibold text-neutral-950 transition-colors hover:bg-neutral-50"
      >
        Reschedule
      </Link>

      <button
        type="button"
        onClick={handleCancelBooking}
        disabled={isPending}
        className="w-full rounded-full px-5 py-3 text-base font-semibold text-red-600 transition-colors hover:bg-red-50"
      >
        {isPending ? 'Cancelling...' : 'Cancel Booking'}
      </button>

      {message ? <p className="text-center text-sm font-medium text-red-600">{message}</p> : null}
    </div>
  );
}
