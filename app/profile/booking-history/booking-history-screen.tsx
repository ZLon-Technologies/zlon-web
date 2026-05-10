'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ArrowLeft, CalendarDays, Plus } from 'lucide-react';
import type { BookingSnapshot } from '../../lib/bookings-data';
import { getUserBookings } from '../../lib/bookings-data';
import { getPastBookings } from '../../lib/bookings-data';

interface BookingHistoryScreenProps {}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function BookingHistoryScreen({}: BookingHistoryScreenProps) {
  const [bookings, setBookings] = useState<BookingSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBookings() {
      try {
        const allBookings = await getUserBookings();
        const pastBookings = getPastBookings(allBookings);
        setBookings(pastBookings);
      } catch (error) {
        console.error('Failed to load bookings:', error);
        setBookings([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadBookings();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full relative">
        <div className="flex flex-col text-neutral-950">
          <header className="border-b border-black/5 bg-white px-4 py-4">
            <div className="flex items-center gap-3">
              <Link
                prefetch={false}
                href="/profile"
                aria-label="Go back"
                className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-neutral-50"
              >
                <ArrowLeft size={22} />
              </Link>
              <h1 className="text-xl font-semibold tracking-tight text-neutral-950">
                Booking History
              </h1>
            </div>
          </header>
          <main className="flex-1 px-4 py-5 pb-36">
            <div className="flex items-center justify-center h-64">
              <p className="text-neutral-500">Loading...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative">
      <div className="flex flex-col text-neutral-950">
        <header className="border-b border-black/5 bg-white px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                prefetch={false}
                href="/profile"
                aria-label="Go back"
                className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-neutral-50"
              >
                <ArrowLeft size={22} />
              </Link>
              <h1 className="text-xl font-semibold tracking-tight text-neutral-950">
                Booking History
              </h1>
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-6 px-4 py-5 pb-36">
          <section className="rounded-[1.85rem] border border-black/10 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-400">
                  Total Appointments
                </p>
                <p className="mt-3 text-4xl font-semibold tracking-tight text-neutral-950">
                  {bookings.length}
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
                <CalendarDays size={24} strokeWidth={2} />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-neutral-950">
                Recent Visits
              </h2>
              <span className="text-sm text-neutral-500">{bookings.length}</span>
            </div>

            {bookings.length === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-neutral-300 bg-white px-6 py-12 text-center shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
                <h3 className="text-lg font-semibold tracking-tight text-neutral-950">
                  No past visits to show
                </h3>
                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  Once you finish an appointment, it will appear here for quick rebooking.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <article
                    key={booking.id}
                    className="rounded-[1.75rem] border border-black/10 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[1.25rem] bg-neutral-200">
                        <Image
                          src={booking.salonImage}
                          alt={booking.salonName}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-lg font-semibold tracking-tight text-neutral-950">
                              {booking.salonName}
                            </h3>
                            <p className="mt-1 text-sm text-neutral-500">{booking.serviceName}</p>
                          </div>

                          <span className="rounded-full bg-neutral-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                            Completed
                          </span>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm text-neutral-500">{booking.dateTimeLabel}</p>
                            <p className="mt-1 text-base font-semibold text-neutral-950">
                              {formatCurrency(booking.total)}
                            </p>
                          </div>

                          <Link
                            prefetch={false}
                            href={`/salon/${booking.salonId}`}
                            className="inline-flex shrink-0 rounded-full bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-95"
                          >
                            Rebook
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>

        <div className="fixed bottom-5 left-1/2 z-20 w-[calc(100%-2rem)] max-w-[448px] -translate-x-1/2">
          <Link
            prefetch={false}
            href="/home"
            className="inline-flex w-full items-center justify-center gap-2 rounded-[1.5rem] bg-neutral-950 px-5 py-4 text-base font-semibold text-white shadow-[0_18px_36px_rgba(17,24,39,0.22)] transition-transform hover:translate-y-[-1px]"
          >
            <Plus size={18} strokeWidth={2.3} />
            Book a New Appointment
          </Link>
        </div>
      </div>
    </div>
  );
}
