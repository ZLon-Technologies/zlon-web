'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { CalendarDays, Clock3, Info, MapPin, Scissors } from 'lucide-react';
import { MobileBottomNav } from '../components/mobile-bottom-nav';
import { cancelBooking } from './actions';
import type { BookingDetails } from './booking-details-types';

interface BookingDetailsScreenProps {
  booking: BookingDetails | null;
}

const surfaceClass =
  'rounded-[1.5rem] border border-black/10 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.08)]';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatBookingDate(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function BookingDetailsScreen({ booking }: BookingDetailsScreenProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<string | null>(null);

  function handleCancelBooking() {
    if (!booking || isPending) {
      return;
    }

    startTransition(async () => {
      const result = await cancelBooking(booking.id);
      setNotification(result.message);

      if (result.ok) {
        router.refresh();
      }
    });
  }

  function handleReschedule() {
    if (!booking) {
      return;
    }

    router.push(`/booking/${booking.id}/reschedule`);
  }

  return (
    <div className="w-full max-w-sm mx-auto min-h-screen bg-white relative">
      {notification && (
        <div className="fixed left-1/2 top-4 z-30 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl bg-black px-4 py-3 text-center text-sm font-semibold text-white shadow-[0_16px_34px_rgba(0,0,0,0.18)]">
          {notification}
        </div>
      )}

      <div className="flex min-h-screen flex-col bg-[#f7f6f3] text-neutral-950">
        <header className="border-b border-black/5 px-4 py-4">
          <button
            type="button"
            aria-label="Booking information"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-black"
          >
            <Info size={20} strokeWidth={2.2} />
          </button>
        </header>

        {!booking ? (
          <main className="flex-1 space-y-4 px-4 py-4 pb-20">
            <section className={`${surfaceClass} p-5`}>
              <h1 className="text-xl font-semibold tracking-tight">No Upcoming Booking</h1>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                Your next ZLon appointment will appear here after it is confirmed.
              </p>
              <Link
                href="/home"
                className="mt-5 block w-full rounded-full bg-black px-5 py-4 text-center text-base font-semibold text-white transition-opacity hover:opacity-95"
              >
                Book an Appointment
              </Link>
            </section>
          </main>
        ) : (
          <main className="flex-1 space-y-4 px-4 py-4 pb-20">
            <section className="overflow-hidden rounded-[1.75rem] bg-white shadow-[0_16px_34px_rgba(15,23,42,0.15)]">
              <div
                className="relative h-72 overflow-hidden rounded-[1.75rem] bg-cover bg-center"
                style={{
                  backgroundImage:
                    'linear-gradient(180deg, rgba(17,24,39,0.05) 10%, rgba(17,24,39,0.72) 100%), url("https://images.unsplash.com/photo-1585747860715-cd4628902d4a?auto=format&fit=crop&w=1200&q=80")',
                }}
              >
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,transparent_24%,rgba(17,24,39,0.7)_100%)]" />

                <div className="absolute left-4 top-4">
                  <span className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-neutral-500 shadow-sm">
                    {booking.status}
                  </span>
                </div>

                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-sm text-white/85">{booking.salonName}</p>
                  <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                    {booking.serviceTitle}
                  </h1>
                  <p className="mt-2 max-w-xs text-sm text-white/80">{booking.location}</p>
                </div>
              </div>
            </section>

            <section className={`${surfaceClass} flex items-center gap-3 p-4`}>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
                <CalendarDays size={20} strokeWidth={2} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-neutral-500">Date &amp; Time</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight">
                  {formatBookingDate(booking.date)}
                </h2>
                <div className="mt-1 flex items-center gap-2 text-sm text-neutral-500">
                  <Clock3 size={18} strokeWidth={2.1} />
                  <span>
                    {booking.timeSlot} ({booking.services[0]?.duration ?? 'Duration unavailable'})
                  </span>
                </div>
              </div>
            </section>

            <section className={`${surfaceClass} flex items-center gap-3 p-4`}>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,#f6c89f_12%,#de9567_24%,#111827_25%,#111827_100%)] text-sm font-semibold text-white">
                AM
              </div>
              <div className="flex-1">
                <p className="text-sm text-neutral-500">Professional</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight">
                  {booking.professionalName}
                </h2>
                <p className="mt-1 text-sm text-neutral-500">{booking.professionalTitle}</p>
              </div>
            </section>

            <section className={`${surfaceClass} flex items-center gap-3 p-4`}>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
                <MapPin size={20} strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-neutral-500">Location</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight">{booking.location}</h2>
                <Link
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    booking.location
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-sm font-medium text-neutral-500 underline-offset-4 hover:underline"
                >
                  Get Directions
                </Link>
              </div>
              <div className="h-20 w-20 shrink-0 rounded-[1.25rem] bg-[linear-gradient(135deg,#9ecf99_0%,#80be89_35%,#8fcbbe_35%,#8fcbbe_70%,#f0b35f_70%,#d4a55f_100%)] bg-[length:200%_200%] shadow-inner" />
            </section>

            <section className={`${surfaceClass} p-5`}>
              <h2 className="text-xl font-semibold tracking-tight">Services Booked</h2>
              <div className="mt-4 space-y-3">
                {booking.services.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center gap-3 rounded-[1.25rem] bg-[#f4f3f0] px-4 py-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-700 shadow-sm">
                      <Scissors size={18} strokeWidth={2.1} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold tracking-tight">{service.name}</h3>
                      <p className="mt-1 text-sm text-neutral-500">{service.duration}</p>
                    </div>
                    <div className="text-base font-semibold text-neutral-950">
                      {formatCurrency(service.price)}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className={`${surfaceClass} p-5`}>
              <h2 className="text-xl font-semibold tracking-tight">Payment Summary</h2>
              <div className="mt-4 space-y-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-neutral-500">Salon Name</span>
                  <span className="text-right font-medium text-neutral-950">{booking.salonName}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-neutral-500">Booking Status</span>
                  <span className="font-medium text-neutral-950">{booking.status}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-neutral-500">Time Slot</span>
                  <span className="text-right font-medium text-neutral-950">{booking.timeSlot}</span>
                </div>
                <div className="h-px bg-black/8" />
                <div className="flex items-center justify-between gap-4 text-xl font-semibold tracking-tight">
                  <span>Total</span>
                  <span>{formatCurrency(booking.totalPrice)}</span>
                </div>
              </div>
            </section>

            <div className="space-y-3 pt-1">
              <Link
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  booking.location
                )}`}
                target="_blank"
                rel="noreferrer"
                className="block w-full rounded-full border border-black/20 px-5 py-4 text-center text-base font-semibold text-neutral-900 transition-colors hover:bg-neutral-50"
              >
                Get Directions
              </Link>
              <button
                type="button"
                onClick={handleReschedule}
                disabled={isPending}
                className="w-full rounded-full bg-black px-5 py-4 text-base font-semibold text-white transition-opacity hover:opacity-95"
              >
                Reschedule
              </button>
              <button
                type="button"
                onClick={handleCancelBooking}
                disabled={isPending}
                className="w-full rounded-full px-5 py-3 text-base font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                {isPending ? 'Cancelling...' : 'Cancel Booking'}
              </button>
            </div>
          </main>
        )}

        <MobileBottomNav />
      </div>
    </div>
  );
}
