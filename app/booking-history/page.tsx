'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, Plus } from 'lucide-react';
import type { BookingRecord } from '../lib/booking-records';
import { mapBookingRows } from '../lib/booking-records';
import { CUSTOMER_SAFE_SALON_SELECT } from '../lib/public-salon-fields';
import { createClient as createSupabaseBrowserClient } from '@/lib/supabase/client';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function BookingHistoryPage() {
  const [history, setHistory] = useState<BookingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let isMounted = true;

    async function fetchBookingHistory() {
      setIsLoading(true);
      setError(null);

      try {
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData.user?.id ?? null;

        const [{ data: bookingData, error: bookingsError }, { data: salonData, error: salonsError }] =
          await Promise.all([
            userId
              ? supabase.from('bookings').select('*').eq('customer_id', userId)
              : Promise.resolve({ data: [], error: null }),
            supabase.from('salons').select(CUSTOMER_SAFE_SALON_SELECT),
          ]);

        if (bookingsError) {
          throw bookingsError;
        }

        if (isMounted) {
          setHistory(
            mapBookingRows(
              (bookingData ?? []) as Array<Record<string, unknown>>,
              salonsError ? [] : ((salonData ?? []) as Array<Record<string, unknown>>)
            )
          );
        }

        if (salonsError) {
          console.error('Unable to load salon details for booking history:', salonsError);
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : 'Unable to load booking history right now.'
          );
          setHistory([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchBookingHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  function handleClearHistory() {
    setHistory([]);
  }

  return (
    <div className="w-full relative pb-32">
      <div className="flex flex-col text-neutral-950">
        <header className="border-b border-black/5 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/profile"
              aria-label="Go back"
              className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-neutral-50"
            >
              <ArrowLeft size={22} />
            </Link>
            <h1 className="flex-1 text-center text-xl font-semibold tracking-tight text-neutral-950">
              Booking History
            </h1>
            <button
              type="button"
              onClick={handleClearHistory}
              className="text-sm font-semibold text-red-500 transition-colors hover:text-red-600"
            >
              Clear History
            </button>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-4 pb-32">
          <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                  Total Appointments
                </p>
                <p className="mt-3 text-4xl font-semibold tracking-tight text-neutral-950">
                  {history.length}
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
                <CalendarDays size={24} strokeWidth={2} />
              </div>
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight text-neutral-950">
                Recent Visits
              </h2>
              <span className="text-sm text-neutral-500">{history.length} visits</span>
            </div>

            {isLoading ? (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
                <p className="text-base font-semibold text-neutral-900">Loading booking history...</p>
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
                <p className="text-base font-semibold text-neutral-900">
                  Unable to load booking history.
                </p>
                <p className="mt-2 text-sm text-neutral-500">{error}</p>
              </div>
            ) : history.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
                <p className="text-base font-semibold text-neutral-900">No booking history yet.</p>
                <p className="mt-2 text-sm text-neutral-500">
                  Book your next appointment and we&apos;ll keep it here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((entry) => (
                  <article
                    key={entry.id}
                    className="rounded-2xl border border-black/10 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-neutral-200">
                        <Image
                          src={entry.image}
                          alt={entry.salonName}
                          fill
                          unoptimized
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold tracking-tight text-neutral-950">
                          {entry.salonName}
                        </h3>
                        <p className="mt-1 text-sm text-neutral-500">{entry.serviceName}</p>
                      </div>

                      <span className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                        {entry.status}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex min-w-0 flex-1 items-center gap-2 text-sm text-neutral-500">
                        <CalendarDays size={16} strokeWidth={2} className="shrink-0" />
                        <span className="truncate">{entry.appointmentLabel}</span>
                      </div>
                      <span className="text-base font-semibold text-neutral-950">
                        {formatCurrency(entry.price)}
                      </span>
                      <Link
                        href={`/salon/${entry.salonId}`}
                        className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
                      >
                        Rebook
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>

        <div className="fixed bottom-0 left-0 right-0 z-20 w-full border-t border-neutral-200 bg-white p-4 [padding-bottom:calc(env(safe-area-inset-bottom)+1rem)]">
          <Link
            href="/home"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-5 py-4 text-base font-semibold text-white transition-opacity hover:opacity-95"
          >
            <Plus size={18} strokeWidth={2.4} />
            Book a New Appointment
          </Link>
        </div>
      </div>
    </div>
  );
}
