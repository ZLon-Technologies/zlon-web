'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { cancelBooking } from '@/app/wallet/actions';
import { RescheduleBookingForm } from '../../booking/[id]/reschedule/reschedule-booking-form';

interface BookingDetailActionsProps {
  bookingId: string;
}

export function BookingDetailActions({ bookingId }: BookingDetailActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);

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
      {isRescheduling ? (
        <div className="rounded-[1.5rem] border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-neutral-900">Pick a new time</h3>
            <button 
              onClick={() => setIsRescheduling(false)}
              className="text-sm font-medium text-neutral-500 hover:text-neutral-900"
            >
              Cancel
            </button>
          </div>
          <RescheduleBookingForm bookingId={bookingId} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsRescheduling(true)}
          className="flex w-full items-center justify-center rounded-full border border-black/15 bg-white px-5 py-4 text-base font-semibold text-neutral-950 transition-colors hover:bg-neutral-50"
        >
          Reschedule
        </button>
      )}

      <button
        type="button"
        onClick={handleCancelBooking}
        disabled={isPending || isRescheduling}
        className="w-full rounded-full px-5 py-3 text-base font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
      >
        {isPending ? 'Cancelling...' : 'Cancel Booking'}
      </button>

      {message ? <p className="text-center text-sm font-medium text-red-600">{message}</p> : null}
    </div>
  );
}
