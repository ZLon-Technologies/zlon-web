'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { cancelBooking } from '@/app/wallet/actions';

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
      <button
        type="button"
        onClick={handleCancelBooking}
        disabled={isPending}
        className="w-full rounded-full px-5 py-3 text-base font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
      >
        {isPending ? 'Cancelling...' : 'Cancel Booking'}
      </button>

      {message ? <p className="text-center text-sm font-medium text-red-600">{message}</p> : null}
    </div>
  );
}
