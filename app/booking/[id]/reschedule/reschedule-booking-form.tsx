'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { rescheduleBooking } from '../../actions';

interface RescheduleBookingFormProps {
  bookingId: string;
}

export function RescheduleBookingForm({ bookingId }: RescheduleBookingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [startTime, setStartTime] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData();
    formData.set('bookingId', bookingId);
    formData.set('startTime', startTime);

    startTransition(async () => {
      const result = await rescheduleBooking(formData);
      setMessage(result.message);

      if (result.ok) {
        router.push('/booking');
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <div>
        <label htmlFor="start-time" className="block text-sm font-medium text-neutral-500">
          New start time
        </label>
        <input
          id="start-time"
          type="datetime-local"
          value={startTime}
          onChange={(event) => setStartTime(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-base text-neutral-950 outline-none transition-colors focus:border-black"
        />
      </div>

      {message && <p className="text-sm font-medium text-neutral-600">{message}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-black px-5 py-4 text-base font-semibold text-white transition-opacity hover:opacity-95"
      >
        {isPending ? 'Saving...' : 'Save New Time'}
      </button>
    </form>
  );
}
