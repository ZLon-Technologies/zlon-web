'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, CalendarDays, Info, MapPin, Scissors, Wallet, Store, ChevronRight } from 'lucide-react';
import type { SalonProfile, SalonService } from '../lib/booking-flow';
import { formatCurrency, formatDateLabel, serializeSelectedServices } from '../lib/booking-flow';

interface ReviewBookingScreenProps {
  salon: SalonProfile;
  selectedServices: SalonService[];
  selectedDate: string;
  selectedSlot: string;
}

type PaymentMethod = 'wallet' | 'pay-at-salon';

export function ReviewBookingScreen({
  salon,
  selectedServices,
  selectedDate,
  selectedSlot,
}: ReviewBookingScreenProps) {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wallet');

  const hasSelectedServices = selectedServices.length > 0;
  const subtotal = selectedServices.reduce((sum, service) => sum + service.price, 0);
  const taxes = Math.round(subtotal * 0.18);
  const platformFee = hasSelectedServices ? 30 : 0;
  const total = subtotal + taxes + platformFee;
  const totalDuration = selectedServices.reduce(
    (sum, service) => sum + service.durationMinutes,
    0
  );

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push('/booking/choose-slot');
  }

  function handleConfirmBooking() {
    if (!hasSelectedServices) {
      return;
    }

    const query = new URLSearchParams({
      salon: salon.id,
      services: selectedServices.map((service) => service.id).join(','),
      cart: serializeSelectedServices(selectedServices),
      totalPrice: String(subtotal),
      totalDuration: String(totalDuration),
      date: selectedDate,
      slot: selectedSlot,
      payment: paymentMethod,
      total: String(total),
    });

    router.replace(`/booking/complete?${query.toString()}`);
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 relative pb-24">
      <header className="border-b border-neutral-200 bg-white">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-neutral-50"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-950">
            Review Booking
          </h1>
        </div>
      </header>

      <main className="space-y-5 px-4 py-4 pb-32">
        <section className="overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-[0_16px_36px_rgba(15,23,42,0.06)]">
          <div className="relative h-56">
            <Image
              src={salon.image}
              alt={salon.name}
              fill
              unoptimized
              sizes="448px"
              className="object-cover"
            />
            <div className="absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
              Selected Venue
            </div>
          </div>

          <div className="p-4">
            <h2 className="text-xl font-semibold tracking-tight text-neutral-950">
              {salon.name}
            </h2>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-neutral-500">
              <MapPin size={14} />
              {salon.distance} away • {salon.location}
            </p>

            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 rounded-[1.5rem] bg-neutral-50 p-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                  <Scissors size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">
                    Service
                  </p>
                  <p className="text-base font-semibold text-neutral-950">
                    {selectedServices.length === 0
                      ? 'No service selected'
                      : selectedServices.length === 1
                      ? selectedServices[0].name
                      : `${selectedServices.length} Services Selected`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-[1.5rem] bg-neutral-50 p-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                  <CalendarDays size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">
                    Appointment
                  </p>
                  <p className="text-base font-semibold text-neutral-950">
                    {formatDateLabel(selectedDate)} at {selectedSlot}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-neutral-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Selected Services
          </h3>
          <div className="mt-4 space-y-3">
            {!hasSelectedServices && (
              <p className="rounded-[1.25rem] bg-neutral-50 px-3 py-3 text-sm text-neutral-500">
                No services selected. Please go back and choose a service.
              </p>
            )}

            {selectedServices.map((service) => (
              <div
                key={service.id}
                className="flex items-start justify-between gap-3 rounded-[1.25rem] bg-neutral-50 px-3 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-neutral-950">{service.name}</p>
                  <p className="mt-1 text-sm text-neutral-500">
                    {service.durationMinutes} min • {service.category}
                  </p>
                </div>
                <span className="text-sm font-semibold text-neutral-950">
                  {formatCurrency(service.price)}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-neutral-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Price Breakdown
          </h3>
          <div className="mt-4 space-y-3 text-sm text-neutral-600">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-neutral-950">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Taxes</span>
              <span className="font-semibold text-neutral-950">{formatCurrency(taxes)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Platform Fees</span>
              <span className="font-semibold text-neutral-950">
                {formatCurrency(platformFee)}
              </span>
            </div>
            <div className="h-px bg-neutral-200" />
            <div className="flex items-center justify-between text-lg font-semibold text-neutral-950">
              <span>Total Amount</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-neutral-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Payment Method
          </h3>
          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('wallet')}
              className={`flex w-full items-center gap-3 rounded-[1.5rem] border px-3 py-3 text-left transition-colors ${
                paymentMethod === 'wallet'
                  ? 'border-black bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.8)]'
                  : 'border-neutral-200 bg-white'
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                <Wallet size={18} className="text-neutral-700" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-neutral-950">Wallet</p>
                <p className="mt-1 text-sm text-neutral-500">
                  Balance available • Instant confirmation
                </p>
              </div>
              <div
                className={`h-5 w-5 shrink-0 rounded-full border-2 ${
                  paymentMethod === 'wallet' ? 'border-black bg-black' : 'border-neutral-300'
                }`}
              />
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('pay-at-salon')}
              className={`flex w-full items-center gap-3 rounded-[1.5rem] border px-3 py-3 text-left transition-colors ${
                paymentMethod === 'pay-at-salon'
                  ? 'border-black bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.8)]'
                  : 'border-neutral-200 bg-white'
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                <Store size={18} className="text-neutral-700" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-neutral-950">Pay at Salon</p>
                <p className="mt-1 text-sm text-neutral-500">
                  Settle up after your service
                </p>
              </div>
              <div
                className={`h-5 w-5 shrink-0 rounded-full border-2 ${
                  paymentMethod === 'pay-at-salon'
                    ? 'border-black bg-black'
                    : 'border-neutral-300'
                }`}
              />
            </button>
          </div>
        </section>

        <section className="rounded-[1.5rem] bg-neutral-200 px-3 py-3 text-neutral-700">
          <div className="flex items-start gap-3">
            <Info size={18} className="mt-0.5 shrink-0" />
            <p className="text-sm leading-6">
              Flexibility is key. You can reschedule or cancel your appointment free
              of charge up to <span className="font-semibold text-neutral-950">2 hours</span>{' '}
              before your scheduled slot.
            </p>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-20 w-full border-t border-neutral-200 bg-white px-4 py-4 shadow-[0_-18px_32px_rgba(15,23,42,0.08)] [padding-bottom:calc(env(safe-area-inset-bottom)+1rem)]">
        <button
          type="button"
          onClick={handleConfirmBooking}
          disabled={!hasSelectedServices}
          className="inline-flex w-full items-center justify-center gap-2 rounded-[1.5rem] bg-black px-4 py-3.5 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          Confirm Booking {formatCurrency(total)}
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
