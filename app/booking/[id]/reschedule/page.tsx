import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { RescheduleBookingForm } from './reschedule-booking-form';

interface RescheduleBookingPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: 'Reschedule Booking',
};

export default async function RescheduleBookingPage({ params }: RescheduleBookingPageProps) {
  const { id } = await params;

  return (
    <div className="w-full max-w-sm mx-auto min-h-screen bg-white relative">
      <div className="flex min-h-screen flex-col bg-[#f7f6f3] text-neutral-950">
        <header className="border-b border-black/5 bg-white px-4 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/booking"
              aria-label="Go back"
              className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-neutral-50"
            >
              <ArrowLeft size={22} />
            </Link>
            <h1 className="text-xl font-semibold tracking-tight text-neutral-950">
              Reschedule
            </h1>
          </div>
        </header>

        <main className="flex-1 space-y-4 px-4 py-4 pb-20">
          <section className="rounded-[1.5rem] border border-black/10 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
              <CalendarDays size={20} strokeWidth={2} />
            </div>
            <h2 className="mt-4 text-xl font-semibold tracking-tight">Pick a new time</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Choose a new start time for this booking. ZLon will keep the update inside the app.
            </p>
            <RescheduleBookingForm bookingId={id} />
          </section>
        </main>
      </div>
    </div>
  );
}
