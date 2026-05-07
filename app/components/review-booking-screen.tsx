'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, CalendarDays, Info, MapPin, Scissors, Wallet, Store, ChevronRight, CreditCard, User } from 'lucide-react';
import type { SalonProfile, SalonService } from '../lib/booking-flow';
import { formatCurrency, formatDateLabel, serializeSelectedServices } from '../lib/booking-flow';
import { useBooking } from '../lib/booking-state';

interface ReviewBookingScreenProps {
  salon: SalonProfile;
  selectedServices: SalonService[];
  selectedDate: string;
  selectedSlot: string;
  staffId?: string;
  staffName?: string;
}

type PaymentMethod = 'wallet' | 'pay-at-salon' | 'online';

export function ReviewBookingScreen({
  salon: propSalon,
  selectedServices: propServices,
  selectedDate: propDate,
  selectedSlot: propSlot,
  staffId: propStaffId,
  staffName: propStaffName,
}: ReviewBookingScreenProps) {
  const router = useRouter();
  const { state: bookingState, subtotal: storeSubtotal, totalDuration: storeDuration } = useBooking();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wallet');

  // Use state as source of truth for salon and cart (Problem 3)
  const salon = {
    ...propSalon,
    id: propSalon.id || bookingState.salon.id,
    name: propSalon.name !== 'Salon' ? propSalon.name : (bookingState.salon.name || 'Salon'),
    location: propSalon.location !== 'Location unavailable' ? propSalon.location : (bookingState.salon.location || 'Location unavailable'),
    image: propSalon.image || bookingState.salon.image || 'https://images.unsplash.com/photo-1585747860715-cd4628902d4a?w=1200&h=900&fit=crop',
    distance: propSalon.distance || bookingState.salon.distance || '',
  };

  const selectedServices = propServices.length > 0 ? propServices : bookingState.cart;
  const selectedDate = propDate || bookingState.appointment.date || '';
  const selectedSlot = propSlot || bookingState.appointment.slot || '';
  const staffId = propStaffId || bookingState.appointment.staffId || 'any';
  const staffName = propStaffName || (staffId === 'any' ? 'Any Staff' : 'Professional Staff');

  // Validation Gate: Redirect if state is lost
  useEffect(() => {
    if (!salon.id || selectedServices.length === 0) {
      router.replace('/home');
    }
  }, [salon.id, selectedServices, router]);

  const hasSelectedServices = selectedServices.length > 0;
  const subtotal = storeSubtotal || selectedServices.reduce((sum, service) => sum + service.price, 0);
  const taxes = Math.round(subtotal * 0.18);
  const platformFee = hasSelectedServices ? 30 : 0;
  const total = subtotal + taxes + platformFee;
  const totalDuration = storeDuration || selectedServices.reduce(
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
    if (!hasSelectedServices) return;

    const query = new URLSearchParams({
      salon: salon.id || '',
      services: selectedServices.map((service) => service.id).join(','),
      cart: serializeSelectedServices(selectedServices),
      totalPrice: String(subtotal),
      totalDuration: String(totalDuration),
      date: selectedDate,
      slot: selectedSlot,
      staff: staffId,
      payment: paymentMethod,
      total: String(total),
    });

    router.replace(`/booking/complete?${query.toString()}`);
  }

  return (
    <div className="w-full relative pb-24">
      <header className="border-b border-neutral-200 bg-white">
        <div className="flex items-center gap-3 px-5 py-3">
          <button type="button" onClick={handleBack} className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-900 hover:bg-neutral-50">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-950">Review Booking</h1>
        </div>
      </header>

      <main className="space-y-5 px-5 py-4 pb-32">
        <section className="overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-[0_16px_36px_rgba(15,23,42,0.06)]">
          <div className="relative h-56">
            <Image
              src={salon.image}
              alt={salon.name || 'Salon'}
              fill
              unoptimized
              sizes="448px"
              className="object-cover"
            />
            <div className="absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">Selected Venue</div>
          </div>

          <div className="p-4">
            <h2 className="text-xl font-semibold tracking-tight text-neutral-950">{salon.name}</h2>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-neutral-500">
              <MapPin size={14} />
              {salon.distance ? `${salon.distance} away • ` : ''}{salon.location}
            </p>

            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 rounded-[1.5rem] bg-neutral-50 p-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                  <Scissors size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">Service</p>
                  <p className="text-base font-semibold text-neutral-950">
                    {selectedServices.length === 0 ? 'No service selected' : selectedServices.length === 1 ? selectedServices[0].name : `${selectedServices.length} Services Selected`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-[1.5rem] bg-neutral-50 p-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                  <CalendarDays size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">Appointment</p>
                  <p className="text-base font-semibold text-neutral-950">
                    {selectedDate ? formatDateLabel(selectedDate) : 'Date TBD'} at {selectedSlot || 'Time TBD'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-[1.5rem] bg-neutral-50 p-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                  <User size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">Selected Staff</p>
                  <p className="text-base font-semibold text-neutral-950">
                    {staffName}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-neutral-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-400">Selected Services</h3>
          <div className="mt-4 space-y-3">
            {selectedServices.map((service) => (
              <div key={service.id} className="flex items-start justify-between gap-3 rounded-[1.25rem] bg-neutral-50 px-3 py-3">
                <div>
                  <p className="text-sm font-semibold text-neutral-950">{service.name}</p>
                  <p className="mt-1 text-sm text-neutral-500">{service.durationMinutes} min • {service.category}</p>
                </div>
                <span className="text-sm font-semibold text-neutral-950">{formatCurrency(service.price)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-neutral-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-400">Price Breakdown</h3>
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
              <span className="font-semibold text-neutral-950">{formatCurrency(platformFee)}</span>
            </div>
            <div className="h-px bg-neutral-200" />
            <div className="flex items-center justify-between text-lg font-semibold text-neutral-950">
              <span>Total Amount</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-neutral-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-400">Payment Method</h3>
          <div className="mt-4 space-y-3">
            {[
              { id: 'wallet', label: 'Wallet', sub: 'Balance available • Instant confirmation', icon: Wallet },
              { id: 'pay-at-salon', label: 'Pay at Salon', sub: 'Settle up after your service', icon: Store },
              { id: 'online', label: 'Online Payment', sub: 'Gateway integration pending', icon: CreditCard, disabled: true }
            ].map((method) => (
              <button
                key={method.id}
                type="button"
                disabled={method.disabled}
                onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                className={`flex w-full items-center gap-3 rounded-[1.5rem] border px-3 py-3 text-left transition-colors ${
                  paymentMethod === method.id ? 'border-black bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.8)]' : 'border-neutral-200 bg-white'
                } ${method.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                  <method.icon size={18} className="text-neutral-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-neutral-950">{method.label}</p>
                  <p className="mt-1 text-sm text-neutral-500">{method.sub}</p>
                </div>
                <div className={`h-5 w-5 shrink-0 rounded-full border-2 ${paymentMethod === method.id ? 'border-black bg-black' : 'border-neutral-300'}`} />
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[1.5rem] bg-neutral-200 px-3 py-3 text-neutral-700">
          <div className="flex items-start gap-3">
            <Info size={18} className="mt-0.5 shrink-0" />
            <p className="text-sm leading-6">Flexibility is key. You can reschedule or cancel your appointment free of charge up to <span className="font-semibold text-neutral-950">2 hours</span> before your scheduled slot.</p>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-20 w-full border-t border-neutral-200 bg-white px-5 py-4 shadow-[0_-18px_32px_rgba(15,23,42,0.08)] [padding-bottom:calc(env(safe-area-inset-bottom)+1rem)]">
        <button
          type="button"
          onClick={handleConfirmBooking}
          disabled={!hasSelectedServices}
          className="inline-flex w-full items-center justify-center gap-2 rounded-[1.5rem] bg-black px-4 py-3.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
        >
          Confirm Booking {formatCurrency(total)} <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
