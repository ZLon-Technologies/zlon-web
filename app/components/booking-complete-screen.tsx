'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Check, MapPin } from 'lucide-react';
import type { SalonProfile, SalonService } from '../lib/booking-flow';
import { formatCurrency, formatDateLabel, formatDuration } from '../lib/booking-flow';

interface BookingCompleteScreenProps {
  salon: SalonProfile;
  selectedServices: SalonService[];
  selectedDate: string;
  selectedSlot: string;
  total: number;
  paymentMethod: 'wallet' | 'pay-at-salon';
}

function createBookingId() {
  return `ZL-${Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, '0')}`;
}

export function BookingCompleteScreen({
  salon,
  selectedServices,
  selectedDate,
  selectedSlot,
  total,
  paymentMethod,
}: BookingCompleteScreenProps) {
  const [bookingId, setBookingId] = useState('');
  const totalDuration = selectedServices.reduce(
    (sum, service) => sum + service.durationMinutes,
    0
  );

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setBookingId(createBookingId());
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  return (
    <div className="w-full relative flex flex-col items-center justify-center px-5 py-12">
      <div className="w-full text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-black shadow-[0_28px_60px_rgba(15,23,42,0.22)] ring-3 ring-neutral-300/60">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
            <Check size={26} className="text-black" />
          </div>
        </div>

        <h1 className="mt-8 text-2xl font-semibold leading-none tracking-tight text-neutral-950">
          Booking Confirmed!
        </h1>
        <p className="mt-3 text-base leading-7 text-neutral-500">
          Booking ID{' '}
          <span className="font-semibold text-neutral-950">{bookingId || 'Generating...'}</span>
        </p>
        <p className="mt-1 text-base leading-7 text-neutral-500">
          {formatDateLabel(selectedDate)} at {selectedSlot}
        </p>

        <section className="mt-6 overflow-hidden rounded-[2rem] border border-neutral-200 bg-white text-left shadow-[0_18px_38px_rgba(15,23,42,0.08)]">
          <div className="flex gap-3 p-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[1.25rem]">
              <Image
                src={salon.image}
                alt={salon.name}
                fill
                unoptimized
                sizes="96px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-tight text-neutral-950">
                {salon.name}
              </h2>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-neutral-500">
                <MapPin size={14} />
                {salon.location}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 border-t border-neutral-200">
            <div className="border-r border-neutral-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
                Date
              </p>
              <p className="mt-2 text-lg font-semibold tracking-tight text-neutral-950">
                {formatDateLabel(selectedDate)}
              </p>
            </div>
            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
                Time
              </p>
              <p className="mt-2 text-lg font-semibold tracking-tight text-neutral-950">
                {selectedSlot}
              </p>
              <p className="mt-1 text-sm text-neutral-500">{formatDuration(totalDuration)}</p>
            </div>
          </div>

          <div className="flex items-end justify-between border-t border-neutral-200 p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
                Service
              </p>
              <p className="mt-2 text-lg font-semibold tracking-tight text-neutral-950">
                {selectedServices.length === 1
                  ? selectedServices[0].name
                  : `${selectedServices.length} Services`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold tracking-tight text-neutral-950">
                {formatCurrency(total)}
              </p>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">
                {paymentMethod === 'wallet' ? 'Paid with wallet' : 'Pay at salon'}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-6 rounded-[2rem] bg-black px-4 py-4 text-left text-white shadow-[0_22px_46px_rgba(0,0,0,0.18)]">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
            Exclusive Reward
          </p>
          <h3 className="mt-3 text-xl font-semibold leading-tight tracking-tight">
            Refer a friend, get ₹100
          </h3>
          <p className="mt-2 text-sm leading-6 text-white/70">
            Give 20% off to your friends and earn credits for your next visit.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <Link
            href="/booking"
            className="inline-flex w-full items-center justify-center rounded-[1.5rem] bg-black px-4 py-3.5 text-base font-semibold text-white"
          >
            View My Bookings
          </Link>
          <Link
            href="/home"
            className="inline-flex w-full items-center justify-center rounded-[1.5rem] border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
