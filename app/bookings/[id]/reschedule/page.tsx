import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, CalendarDays } from 'lucide-react';

interface RescheduleBookingPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Reschedule Booking',
};

export function generateStaticParams(): Array<{ id: string }> {
  return [{ id: 'placeholder' }];
}

export default async function RescheduleBookingPage({ params }: RescheduleBookingPageProps) {
  const { id } = await params;

  return (
    <div className="w-full relative">
      <div className="flex flex-col text-neutral-950">
        <header className="border-b border-black/5 bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <Link
              prefetch={false}
              href={`/bookings/${id}`}
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

        <main className="flex-1 space-y-4 px-5 py-4 pb-20">
          <section className="rounded-[1.5rem] border border-black/10 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
              <CalendarDays size={20} strokeWidth={2} />
            </div>
            <h2 className="mt-4 text-xl font-semibold tracking-tight">Pick a new time</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Choose a new start time for this booking and we&apos;ll update it across your account.
            </p>
            <div className="mt-5 space-y-4">
              <p className="text-sm text-neutral-500">Reschedule form will be available soon.</p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
