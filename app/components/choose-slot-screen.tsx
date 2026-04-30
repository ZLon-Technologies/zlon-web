'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Clock3,
  Moon,
  SunMedium,
  Sunrise,
} from 'lucide-react';
import type { SalonProfile, SalonService } from '../lib/booking-flow';
import {
  formatCurrency,
  formatDateLabel,
  formatDuration,
  formatLongDate,
  serializeSelectedServices,
} from '../lib/booking-flow';

interface ChooseSlotScreenProps {
  salon: SalonProfile;
  selectedServices: SalonService[];
}

interface DateOption {
  id: string;
  dayLabel: string;
  dayNumber: string;
}

interface SlotOption {
  time: string;
  state: 'available' | 'booked';
}

function formatDateId(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getCurrentMonthDateOptions(): DateOption[] {
  const today = new Date();
  const cursor = new Date(today.getFullYear(), today.getMonth(), 1);
  const finalDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const options: DateOption[] = [];

  while (cursor <= finalDayOfMonth) {
    options.push({
      id: formatDateId(cursor),
      dayLabel: new Intl.DateTimeFormat('en-US', { weekday: 'short' })
        .format(cursor)
        .toUpperCase(),
      dayNumber: String(cursor.getDate()),
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return options;
}

const slotGroups: Array<{
  label: string;
  icon: typeof Sunrise;
  slots: SlotOption[];
}> = [
  {
    label: 'Morning Slots',
    icon: Sunrise,
    slots: [
      { time: '09:00 AM', state: 'booked' },
      { time: '09:30 AM', state: 'available' },
      { time: '10:00 AM', state: 'available' },
      { time: '10:30 AM', state: 'available' },
      { time: '11:00 AM', state: 'available' },
      { time: '11:30 AM', state: 'booked' },
    ],
  },
  {
    label: 'Afternoon Slots',
    icon: SunMedium,
    slots: [
      { time: '01:00 PM', state: 'available' },
      { time: '01:45 PM', state: 'available' },
      { time: '02:30 PM', state: 'available' },
      { time: '03:15 PM', state: 'booked' },
      { time: '04:00 PM', state: 'available' },
      { time: '04:45 PM', state: 'available' },
    ],
  },
  {
    label: 'Evening Slots',
    icon: Moon,
    slots: [
      { time: '06:00 PM', state: 'available' },
      { time: '06:45 PM', state: 'available' },
      { time: '07:30 PM', state: 'available' },
    ],
  },
];

export function ChooseSlotScreen({ salon, selectedServices }: ChooseSlotScreenProps) {
  const router = useRouter();
  const [dateOptions] = useState<DateOption[]>(getCurrentMonthDateOptions);
  const [selectedDate, setSelectedDate] = useState(() => formatDateId(new Date()));
  const [selectedStaffId, setSelectedStaffId] = useState(salon.staff[0]?.id ?? '');
  const [selectedSlot, setSelectedSlot] = useState('10:00 AM');

  const hasSelectedServices = selectedServices.length > 0;
  const totalDurationMinutes = selectedServices.reduce(
    (sum, service) => sum + service.durationMinutes,
    0
  );
  const totalPrice = selectedServices.reduce((sum, service) => sum + service.price, 0);
  const selectedServiceLabel =
    selectedServices.length === 0
      ? 'No service selected'
      : selectedServices.length === 1
      ? selectedServices[0].name
      : `${selectedServices[0]?.name} +${selectedServices.length - 1} more`;

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(`/salon/${salon.id}`);
  }

  function handleReview() {
    if (!selectedSlot || !hasSelectedServices) {
      return;
    }

    const query = new URLSearchParams({
      salon: salon.id,
      services: selectedServices.map((service) => service.id).join(','),
      cart: serializeSelectedServices(selectedServices),
      totalPrice: String(totalPrice),
      totalDuration: String(totalDurationMinutes),
      date: selectedDate,
      slot: selectedSlot,
      staff: selectedStaffId,
    });

    router.push(`/booking/review?${query.toString()}`);
  }

  return (
    <div className="w-full min-h-screen bg-white relative overflow-x-hidden pb-28">
      <header className="border-b border-neutral-100 bg-white">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-neutral-50"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold tracking-tight text-neutral-950">
            Select Date &amp; Time
          </h1>
        </div>
      </header>

      <main className="p-4 pb-32">
        <section className="rounded-[2rem] bg-white p-4 shadow-[0_18px_38px_rgba(15,23,42,0.06)] ring-1 ring-neutral-100">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Selected Service
          </p>
          <div className="mt-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold leading-tight tracking-tight text-neutral-950">
                {selectedServiceLabel}
              </h2>
              <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-neutral-500">
                <Clock3 size={16} />
                Total duration: {formatDuration(totalDurationMinutes)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold tracking-tight text-neutral-950">
                {formatCurrency(totalPrice)}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-neutral-950">
              {formatLongDate(selectedDate)}
            </h2>
            <CalendarDays size={20} className="text-neutral-500" />
          </div>

          <div className="-mx-4 mt-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max gap-3">
              {dateOptions.map((date) => {
                const active = date.id === selectedDate;

                return (
                  <button
                    key={date.id}
                    type="button"
                    onClick={() => setSelectedDate(date.id)}
                    className={`flex h-28 w-24 shrink-0 flex-col items-center justify-center rounded-[1.5rem] border text-center transition-colors ${
                      active
                        ? 'border-black bg-black text-white shadow-[0_16px_34px_rgba(0,0,0,0.16)]'
                        : 'border-neutral-300 bg-white text-neutral-500'
                    }`}
                  >
                    <span className="text-xs font-medium">{date.dayLabel}</span>
                    <span className="mt-2 text-2xl font-semibold leading-none">
                      {date.dayNumber}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-6">
          <h3 className="text-lg font-semibold tracking-tight text-neutral-950">
            Available Staff
          </h3>
          <div className="mt-3 flex gap-3 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {salon.staff.map((staffMember) => {
              const selected = staffMember.id === selectedStaffId;

              return (
                <button
                  key={staffMember.id}
                  type="button"
                  onClick={() => setSelectedStaffId(staffMember.id)}
                  className="flex flex-shrink-0 shrink-0 flex-col items-center"
                >
                  <div
                    className={`flex h-16 w-16 flex-shrink-0 shrink-0 items-center justify-center rounded-full text-base font-semibold shadow-sm ring-2 transition-colors ${
                      selected
                        ? `${staffMember.colorClass} ring-black`
                        : `${staffMember.colorClass} ring-transparent`
                    }`}
                  >
                    {staffMember.initials}
                  </div>
                  <span className="mt-2 text-xs font-medium text-neutral-600">
                    {staffMember.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-6 space-y-5">
          {slotGroups.map(({ label, icon: Icon, slots }) => (
            <div key={label}>
              <div className="mb-3 flex items-center gap-2.5">
                <Icon size={16} className="text-neutral-500" />
                <h4 className="text-sm font-semibold uppercase tracking-[0.08em] text-neutral-800">
                  {label}
                </h4>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {slots.map((slot) => {
                  const disabled = slot.state === 'booked';
                  const selected = selectedSlot === slot.time;

                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={disabled}
                      onClick={() => setSelectedSlot(slot.time)}
                      className={`rounded-[1.25rem] border px-2.5 py-3 text-sm font-semibold transition-colors ${
                        disabled
                          ? 'border-transparent bg-neutral-100 text-neutral-300'
                          : selected
                          ? 'border-neutral-800 bg-black text-white shadow-[inset_0_0_0_2px_rgba(255,255,255,0.18)]'
                          : 'border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50'
                      }`}
                    >
                      {slot.time}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-20 w-full border-t border-neutral-200 bg-white p-4 shadow-[0_-18px_32px_rgba(15,23,42,0.08)] [padding-bottom:calc(env(safe-area-inset-bottom)+1rem)]">
        <div className="flex items-center justify-between gap-3 text-neutral-500">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Selected Slot
            </p>
            <p className="mt-1 text-base font-semibold tracking-tight text-neutral-900">
              {formatDateLabel(selectedDate)} • {selectedSlot || 'Pick a slot'}
            </p>
          </div>
          <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-500">
            {formatDuration(totalDurationMinutes)}
          </span>
        </div>
        <button
          type="button"
          onClick={handleReview}
          disabled={!selectedSlot || !hasSelectedServices}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[1.5rem] bg-black px-4 py-3 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          Review Booking
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
