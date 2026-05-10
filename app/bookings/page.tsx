import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import { MobileBottomNav } from '../components/mobile-bottom-nav';
import { BookingsList } from './bookings-list';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Bookings',
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function BookingsPage() {
  return (
    <div className="w-full relative">
      <div className="flex flex-col text-neutral-950">
        <header className="border-b border-black/5 bg-white px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Bottom Nav Tab
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950">
                Bookings
              </h1>
            </div>
            <Link
              prefetch={false}
              href="/profile/booking-history"
              className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              History
            </Link>
          </div>
        </header>

        <main className="flex-1 space-y-6 px-4 py-5 pb-24">
          <section className="overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top_left,_#343434_0%,_#18181b_58%,_#09090b_100%)] p-5 text-white shadow-[0_18px_42px_rgba(17,24,39,0.18)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">
              Upcoming Appointments
            </p>
            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-4xl font-semibold tracking-tight">-</p>
                <p className="mt-2 max-w-[15rem] text-sm leading-6 text-white/70">
                  Keep track of your next confirmed salon visits in one place.
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white">
                <CalendarDays size={24} strokeWidth={2} />
              </div>
            </div>
          </section>

          <BookingsList />
        </main>

        <MobileBottomNav />
      </div>
    </div>
  );
}
