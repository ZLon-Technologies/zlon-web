import Image from 'next/image';
import Link from 'next/link';
import { Check, MapPin } from 'lucide-react';
import type { SalonProfile, SalonService } from '../lib/booking-flow';
import { formatCurrency, formatDateLabel, formatDuration } from '../lib/booking-flow';

interface BookingCompleteScreenProps {
  salon: SalonProfile;
  selectedServices: SalonService[];
  selectedDate: string;
  selectedSlot: string;
  total: number;
  bookingId: string;
  paymentMethod: 'wallet' | 'pay-at-salon';
}

export function BookingCompleteScreen({
  salon,
  selectedServices,
  selectedDate,
  selectedSlot,
  total,
  bookingId,
  paymentMethod,
}: BookingCompleteScreenProps) {
  const totalDuration = selectedServices.reduce(
    (sum, service) => sum + service.durationMinutes,
    0
  );

  return (
    <div className="w-full max-w-sm mx-auto min-h-screen bg-white relative flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full bg-black shadow-[0_28px_60px_rgba(15,23,42,0.22)] ring-4 ring-neutral-300/60">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white">
            <Check size={34} className="text-black" />
          </div>
        </div>

        <h1 className="mt-10 text-[3rem] font-semibold leading-none tracking-tight text-neutral-950">
          Booking Confirmed!
        </h1>
        <p className="mt-4 text-lg leading-8 text-neutral-500">
          Booking ID <span className="font-semibold text-neutral-950">{bookingId}</span>
        </p>
        <p className="mt-2 text-lg leading-8 text-neutral-500">
          {formatDateLabel(selectedDate)} at {selectedSlot}
        </p>

        <section className="mt-8 overflow-hidden rounded-[2rem] border border-neutral-200 bg-white text-left shadow-[0_18px_38px_rgba(15,23,42,0.08)]">
          <div className="flex gap-4 p-5">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[1.5rem]">
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
              <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">
                {salon.name}
              </h2>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-neutral-500">
                <MapPin size={16} />
                {salon.location}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 border-t border-neutral-200">
            <div className="border-r border-neutral-200 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-neutral-400">
                Date
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
                {formatDateLabel(selectedDate)}
              </p>
            </div>
            <div className="p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-neutral-400">
                Time
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
                {selectedSlot}
              </p>
              <p className="mt-1 text-base text-neutral-500">{formatDuration(totalDuration)}</p>
            </div>
          </div>

          <div className="flex items-end justify-between border-t border-neutral-200 p-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-neutral-400">
                Service
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
                {selectedServices.length === 1
                  ? selectedServices[0].name
                  : `${selectedServices.length} Services`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[2.25rem] font-semibold tracking-tight text-neutral-950">
                {formatCurrency(total)}
              </p>
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-neutral-500">
                {paymentMethod === 'wallet' ? 'Paid with wallet' : 'Pay at salon'}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-8 rounded-[2rem] bg-black px-6 py-6 text-left text-white shadow-[0_22px_46px_rgba(0,0,0,0.18)]">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
            Exclusive Reward
          </p>
          <h3 className="mt-4 text-[2rem] font-semibold leading-tight tracking-tight">
            Refer a friend, get ₹100
          </h3>
          <p className="mt-3 text-base leading-7 text-white/70">
            Give 20% off to your friends and earn credits for your next visit.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          <Link
            href="/booking"
            className="inline-flex w-full items-center justify-center rounded-[1.5rem] bg-black px-5 py-5 text-xl font-semibold text-white"
          >
            View My Bookings
          </Link>
          <Link
            href="/home"
            className="inline-flex w-full items-center justify-center rounded-[1.5rem] border border-neutral-200 bg-white px-5 py-4 text-base font-semibold text-neutral-700"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
