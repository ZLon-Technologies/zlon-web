'use client';

export const generateStaticParams = () => [];

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarDays, MapPin, MessageCircleMore, Wallet } from 'lucide-react';
import { BookingDetailActions } from './booking-detail-actions';
import { getBookingById, type BookingSnapshot } from '../../lib/bookings-data';

interface BookingDetailPageProps {
  params: Promise<{ id: string }>;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export default function BookingDetailPage({ params }: BookingDetailPageProps) {
  const { id } = use(params);
  const [booking, setBooking] = useState<BookingSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBooking() {
      try {
        const data = await getBookingById(id);
        setBooking(data);
      } catch (error) {
        console.error('Error loading booking:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadBooking();
  }, [id]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!booking) {
    notFound();
  }

  return (
    <div className="w-full relative bg-[#f4efe8]">
      <div className="flex min-h-screen flex-col text-neutral-950">
        <section className="relative h-[23rem] overflow-hidden rounded-b-[2.25rem] bg-neutral-900">
          <Image
            src={booking.salonImage}
            alt={booking.salonName}
            fill
            priority
            sizes="(max-width: 480px) 100vw, 480px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.18)_0%,rgba(15,23,42,0.72)_72%,rgba(15,23,42,0.86)_100%)]" />

          <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
            <Link
              prefetch={false}
              href="/bookings"
              aria-label="Back to bookings"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-neutral-950 shadow-lg backdrop-blur transition-transform hover:scale-[0.98]"
            >
              <ArrowLeft size={20} strokeWidth={2.1} />
            </Link>
            <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-950 shadow-lg">
              {booking.statusLabel}
            </span>
          </div>

          <div className="absolute inset-x-4 bottom-5">
            <p className="text-sm font-medium text-white/80">{booking.salonName}</p>
            <h1 className="mt-2 text-[2rem] font-semibold leading-tight tracking-tight text-white">
              {booking.serviceName}
            </h1>
          </div>
        </section>

        <main className="-mt-5 flex-1 space-y-4 px-4 pb-8">
          <section className="rounded-[1.75rem] border border-black/10 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
                <CalendarDays size={20} strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-500">Date &amp; Time</p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight text-neutral-950">
                  {booking.dateLabel}
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  {booking.timeLabel} • {booking.durationLabel}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-black/10 bg-white p-4 shadow-[0_10px_24_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,_#f0c7a2_18%,_#d38d60_36%,_#27272a_37%,_#27272a_100%)] text-base font-semibold text-white">
                {getInitials(booking.staffName) || 'SP'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-500">Professional</p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight text-neutral-950">
                  {booking.staffName}
                </h2>
                <p className="mt-1 text-sm text-neutral-500">{booking.staffTitle}</p>
              </div>
              <Link
                prefetch={false}
                href="/customer-support"
                aria-label="Chat with support"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-white transition-opacity hover:opacity-90"
              >
                <MessageCircleMore size={18} strokeWidth={2} />
              </Link>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-black/10 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-500">Location</p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight text-neutral-950">
                  {booking.salonName}
                </h2>
                <div className="mt-2 flex items-start gap-2 text-sm text-neutral-500">
                  <MapPin size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
                  <span>{booking.salonLocation}</span>
                </div>
              </div>
              <div className="flex h-24 w-24 shrink-0 items-end overflow-hidden rounded-[1.35rem] bg-[linear-gradient(145deg,_#d8ead3_0%,_#a8d0bf_38%,_#8ab8d8_38%,_#8ab8d8_70%,_#f2cb7c_70%,_#ddb06b_100%)] p-3 shadow-inner">
                <div className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-700">
                  Map
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-black/10 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
                <Wallet size={18} strokeWidth={2} />
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-neutral-950">
                Payment Summary
              </h2>
            </div>

            <div className="mt-5 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-neutral-500">Service</span>
                <span className="text-right font-medium text-neutral-950">{booking.serviceName}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-neutral-500">Price</span>
                <span className="font-medium text-neutral-950">{formatCurrency(booking.price)}</span>
              </div>
              <div className="h-px bg-black/10" />
              <div className="flex items-center justify-between gap-4 text-base font-semibold text-neutral-950">
                <span>Total</span>
                <span>{formatCurrency(booking.total)}</span>
              </div>
            </div>
          </section>

          <BookingDetailActions bookingId={booking.id} />
        </main>
      </div>
    </div>
  );
}
