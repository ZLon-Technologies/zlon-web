'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { CalendarDays, ChevronRight, Clock3, MapPin } from 'lucide-react';
import type { BookingSnapshot } from '../lib/bookings-data';
import { getUserBookings, getUpcomingBookings } from '../lib/bookings-data';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function BookingsList() {
  const [upcomingBookings, setUpcomingBookings] = useState<BookingSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBookings() {
      try {
        const allBookings = await getUserBookings();
        const upcoming = getUpcomingBookings(allBookings);
        setUpcomingBookings(upcoming);
      } catch (error) {
        console.error('Failed to load bookings:', error);
        setUpcomingBookings([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadBookings();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 px-4 py-5 pb-24">
        <div className="flex items-center justify-center h-64">
          <p className="text-neutral-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {upcomingBookings.length === 0 ? (
        <section className="rounded-[1.75rem] border border-dashed border-neutral-300 bg-white px-6 py-12 text-center shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
          <h2 className="text-lg font-semibold tracking-tight text-neutral-950">
            No active bookings right now
          </h2>
          <p className="mt-2 text-sm leading-6 text-neutral-800">
            Your confirmed appointments will show up here as soon as you book them.
          </p>
          <Link
            prefetch={false}
            href="/home"
            className="mt-5 inline-flex rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-95"
          >
            Find a salon
          </Link>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-neutral-950">
              Confirmed For You
            </h2>
            <span className="text-sm text-neutral-500">{upcomingBookings.length}</span>
          </div>

          <div className="space-y-4">
            {upcomingBookings.map((booking) => (
              <Link
                prefetch={false}
                key={booking.id}
                href={`/bookings/${booking.id}`}
                className="block rounded-[1.75rem] border border-black/10 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition-transform hover:translate-y-[-1px]"
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
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
                          {booking.salonName}
                        </p>
                        <h3 className="mt-1 text-lg font-semibold tracking-tight text-neutral-950">
                          {booking.serviceName}
                        </h3>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                        {booking.statusLabel}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-2 text-sm text-neutral-500">
                      <div className="flex items-center gap-2">
                        <Clock3 size={16} strokeWidth={2} />
                        <span>{booking.dateTimeLabel}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={16} strokeWidth={2} />
                        <span className="truncate">{booking.salonLocation}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-base font-semibold text-neutral-950">
                        {formatCurrency(booking.total)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-900">
                        View details
                        <ChevronRight size={16} strokeWidth={2.1} />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
