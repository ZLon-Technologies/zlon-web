'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Clock3,
  Moon,
  SunMedium,
  Sunrise,
  User,
} from 'lucide-react';
import type { SalonProfile, SalonService } from '../lib/booking-flow';
import {
  formatCurrency,
  formatDateLabel,
  formatDuration,
  formatLongDate,
  serializeSelectedServices,
} from '../lib/booking-flow';
import { createClient as createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useBooking } from '../lib/booking-state';

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

function getUpcomingDateOptions(): DateOption[] {
  const today = new Date();
  const options: DateOption[] = [];

  for (let i = 0; i < 30; i++) {
    const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    options.push({
      id: formatDateId(cursor),
      dayLabel: new Intl.DateTimeFormat('en-US', { weekday: 'short' })
        .format(cursor)
        .toUpperCase(),
      dayNumber: String(cursor.getDate()),
    });
  }

  return options;
}

const ALL_SLOTS = [
  { time: '09:00 AM', group: 'Morning Slots', icon: Sunrise },
  { time: '09:30 AM', group: 'Morning Slots', icon: Sunrise },
  { time: '10:00 AM', group: 'Morning Slots', icon: Sunrise },
  { time: '10:30 AM', group: 'Morning Slots', icon: Sunrise },
  { time: '11:00 AM', group: 'Morning Slots', icon: Sunrise },
  { time: '11:30 AM', group: 'Morning Slots', icon: Sunrise },
  { time: '01:00 PM', group: 'Afternoon Slots', icon: SunMedium },
  { time: '01:45 PM', group: 'Afternoon Slots', icon: SunMedium },
  { time: '02:30 PM', group: 'Afternoon Slots', icon: SunMedium },
  { time: '03:15 PM', group: 'Afternoon Slots', icon: SunMedium },
  { time: '04:00 PM', group: 'Afternoon Slots', icon: SunMedium },
  { time: '04:45 PM', group: 'Afternoon Slots', icon: SunMedium },
  { time: '06:00 PM', group: 'Evening Slots', icon: Moon },
  { time: '06:45 PM', group: 'Evening Slots', icon: Moon },
  { time: '07:30 PM', group: 'Evening Slots', icon: Moon },
];

function calculateEndTime(startTime: string, durationMinutes: number) {
  if (!startTime) return '';

  const [time, period] = startTime.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  let adjustedHours = hours;

  if (period === 'PM' && adjustedHours !== 12) adjustedHours += 12;
  if (period === 'AM' && adjustedHours === 12) adjustedHours = 0;
  
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  date.setMinutes(date.getMinutes() + durationMinutes);
  
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function ChooseSlotScreen({ salon, selectedServices: propServices }: ChooseSlotScreenProps) {
  const router = useRouter();
  const { state: bookingState, updateAppointment, totalDuration: storeDuration, subtotal: storeSubtotal, hasHydrated } = useBooking();
  
  // Use state if props are missing
  const selectedServices = propServices.length > 0 ? propServices : bookingState.cart;
  const totalDurationMinutes = storeDuration || selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalPrice = storeSubtotal || selectedServices.reduce((sum, s) => sum + s.price, 0);

  // Validation Gate: Redirect if no services, but ONLY after hydration
  useEffect(() => {
    if (hasHydrated && selectedServices.length === 0) {
      router.replace(`/salon/${salon.id}`);
    }
  }, [hasHydrated, selectedServices, router, salon.id]);

  const [dateOptions] = useState<DateOption[]>(getUpcomingDateOptions);
  const [selectedDate, setSelectedDate] = useState(() => formatDateId(new Date()));
  const [selectedStaffId, setSelectedStaffId] = useState('any');
  const [selectedSlot, setSelectedSlot] = useState('');
  
  const [dailyBookings, setDailyBookings] = useState<Array<{ staff_id: string, time_slot: string, duration: number }>>([]);
  const [staffList, setStaffList] = useState<Array<{ id: string, name: string, initials?: string, color_class?: string, colorClass?: string }>>([]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let isMounted = true;

    async function fetchData() {
      console.log('Fetching data for salon_id:', salon.id, 'and date:', selectedDate);
      try {
        const [bookingsRes, staffRes, servicesRes] = await Promise.all([
          supabase
            .from('bookings')
            .select('staff_id, time_slot, appointment_timestamp, service_id')
            .eq('salon_id', salon.id)
            .eq('date', selectedDate)
            .not('status', 'eq', 'cancelled'),
          supabase
            .from('staff')
            .select('*')
            .eq('salon_id', salon.id),
          supabase
            .from('services')
            .select('id, duration_minutes')
            .eq('salon_id', salon.id)
        ]);

        if (bookingsRes.error) console.error('Bookings fetch error:', bookingsRes.error);
        if (staffRes.error) console.error('Staff fetch error:', staffRes.error);

        const servicesMap = new Map((servicesRes.data || []).map(s => [String(s.id), Number(s.duration_minutes) || 0]));

        const processedBookings = (bookingsRes.data || []).map(b => {
          const serviceIds = (b.service_id || '').split(',').map((id: string) => id.trim());
          const duration = serviceIds.reduce((sum: number, id: string) => sum + (servicesMap.get(id) || 0), 0);
          return { staff_id: b.staff_id, time_slot: b.time_slot, duration: duration || 30 }; // default to 30 if 0
        });

        if (isMounted) {
          setDailyBookings(processedBookings);
          setStaffList(staffRes.data || []);
        }
      } catch (err) {
        console.error('Unexpected fetch error:', err);
      }
    }

    fetchData();
    return () => { isMounted = false; };
  }, [salon.id, selectedDate]);

  function parseTimeToMinutes(timeStr: string) {
    if (!timeStr) return 0;
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let adjustedHours = hours;
    if (period === 'PM' && adjustedHours !== 12) adjustedHours += 12;
    if (period === 'AM' && adjustedHours === 12) adjustedHours = 0;
    return adjustedHours * 60 + minutes;
  }

  function checkSlotAvailability(slotTime: string) {
    const newStart = parseTimeToMinutes(slotTime);
    const newEnd = newStart + totalDurationMinutes;

    const isOverlap = (b: { time_slot: string, duration: number }) => {
      const bStart = parseTimeToMinutes(b.time_slot);
      const bEnd = bStart + b.duration;
      // Overlap condition: start1 < end2 && start2 < end1
      return newStart < bEnd && bStart < newEnd;
    };

    if (selectedStaffId === 'any') {
      // Find all distinct staff members that have overlapping bookings
      const bookedStaffIds = new Set(dailyBookings.filter(isOverlap).map(b => b.staff_id));
      return staffList.length > 0 && bookedStaffIds.size >= staffList.length;
    } else {
      // Slot is booked if the SPECIFIC selected staff has an overlapping booking
      return dailyBookings.some(b => b.staff_id === selectedStaffId && isOverlap(b));
    }
  }

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
    if (!selectedSlot || selectedServices.length === 0) return;

    // Sync appointment to store
    updateAppointment({
      date: selectedDate,
      slot: selectedSlot,
      selectedStaffId: selectedStaffId,
    });

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

  const uiStaffList = [
    { id: 'any', name: 'Any Staff', initials: <User size={24} />, colorClass: 'bg-neutral-100 text-neutral-600' },
    ...staffList.map(s => ({
      ...s,
      initials: s.initials || s.name?.substring(0, 2).toUpperCase() || 'ST',
      colorClass: s.color_class || s.colorClass || 'bg-slate-200 text-slate-900'
    }))
  ];

  const slotGroups = [
    { label: 'Morning Slots', icon: Sunrise, slots: [] as SlotOption[] },
    { label: 'Afternoon Slots', icon: SunMedium, slots: [] as SlotOption[] },
    { label: 'Evening Slots', icon: Moon, slots: [] as SlotOption[] },
  ];

  const now = new Date();
  const todayId = formatDateId(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  ALL_SLOTS.forEach(slotDef => {
    const isBooked = checkSlotAvailability(slotDef.time);

    // Check if the slot time is in the past
    let isPastSlot = false;
    if (selectedDate < todayId) {
      isPastSlot = true;
    } else if (selectedDate === todayId) {
      isPastSlot = parseTimeToMinutes(slotDef.time) < currentMinutes;
    }

    const groupIndex = slotGroups.findIndex(g => g.label === slotDef.group);
    if (groupIndex !== -1) {
      slotGroups[groupIndex].slots.push({
        time: slotDef.time,
        state: isBooked || isPastSlot ? 'booked' : 'available'
      });
    }
  });

  return (
    <div className="w-full relative overflow-x-hidden pb-28">
      <header className="border-b border-neutral-100 bg-white">
        <div className="flex items-center gap-3 px-5 py-3">
          <button type="button" onClick={handleBack} className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-900 hover:bg-neutral-50">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold tracking-tight text-neutral-950">Select Date &amp; Time</h1>
        </div>
      </header>

      <main className="px-5 py-4 pb-32">
        <section className="rounded-[2rem] bg-white p-4 shadow-[0_18px_38px_rgba(15,23,42,0.06)] ring-1 ring-neutral-100">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-400">Selected Service</p>
          <div className="mt-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold leading-tight tracking-tight text-neutral-950">{selectedServiceLabel}</h2>
              <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-neutral-500">
                <Clock3 size={16} />
                Total duration: {formatDuration(totalDurationMinutes)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold tracking-tight text-neutral-950">{formatCurrency(totalPrice)}</p>
            </div>
          </div>
        </section>

        <section className="mt-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-neutral-950">{formatLongDate(selectedDate)}</h2>
            <CalendarDays size={20} className="text-neutral-500" />
          </div>
          <div className="-mx-4 mt-4 overflow-x-auto px-4 pb-2">
            <div className="flex min-w-max gap-3">
              {dateOptions.map((date) => {
                const active = date.id === selectedDate;
                return (
                  <button
                    key={date.id}
                    type="button"
                    onClick={() => { setSelectedDate(date.id); setSelectedSlot(''); }}
                    className={`flex h-28 w-24 shrink-0 flex-col items-center justify-center rounded-[1.5rem] border text-center transition-colors ${
                      active ? 'border-black bg-black text-white shadow-[0_16px_34px_rgba(0,0,0,0.16)]' : 'border-neutral-300 bg-white text-neutral-500'
                    }`}
                  >
                    <span className="text-xs font-medium">{date.dayLabel}</span>
                    <span className="mt-2 text-2xl font-semibold leading-none">{date.dayNumber}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-6">
          <h3 className="text-lg font-semibold tracking-tight text-neutral-950">Available Staff</h3>
          <div className="mt-3 flex gap-3 overflow-x-auto py-2">
            {uiStaffList.map((staffMember) => {
              const selected = staffMember.id === selectedStaffId;
              return (
                <button key={staffMember.id} type="button" onClick={() => setSelectedStaffId(staffMember.id)} className="flex flex-shrink-0 shrink-0 flex-col items-center">
                  <div className={`flex h-16 w-16 flex-shrink-0 shrink-0 items-center justify-center rounded-full text-base font-semibold shadow-sm ring-2 transition-colors ${
                    selected ? `${staffMember.colorClass} ring-black` : `${staffMember.colorClass} ring-transparent`
                  }`}>{staffMember.initials}</div>
                  <span className="mt-2 text-xs font-medium text-neutral-600">{staffMember.name}</span>
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
                <h4 className="text-sm font-semibold uppercase tracking-[0.08em] text-neutral-800">{label}</h4>
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
                      className={`relative flex flex-col items-center justify-center rounded-[1.25rem] border px-2.5 py-3 transition-colors ${
                        disabled ? 'border-transparent bg-neutral-100 text-neutral-300 cursor-not-allowed' :
                        selected ? 'border-neutral-800 bg-black text-white shadow-[inset_0_0_0_2px_rgba(255,255,255,0.18)]' :
                        'border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50'
                      }`}
                    >
                      <span className="text-sm font-semibold">{slot.time}</span>
                      {selected && (
                        <span className="mt-1 block text-[10px] font-medium opacity-90">
                          {totalDurationMinutes} min • {calculateEndTime(slot.time, totalDurationMinutes)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-20 w-full border-t border-neutral-200 bg-white px-5 py-4 shadow-[0_-18px_32px_rgba(15,23,42,0.08)] [padding-bottom:calc(env(safe-area-inset-bottom)+1rem)]">
        <div className="flex items-center justify-between gap-3 text-neutral-500">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Selected Slot</p>
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
          disabled={!selectedSlot || selectedServices.length === 0}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[1.5rem] bg-black px-4 py-3 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          Review Booking <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
