import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CalendarDays,
  Clock3,
  Info,
  MapPin,
  Scissors,
} from 'lucide-react';
import { MobileBottomNav } from '../components/mobile-bottom-nav';

interface BookedService {
  id: string;
  name: string;
  duration: string;
  price: number;
}

const booking = {
  serviceTitle: 'Classic Haircut',
  salonName: 'ZLon. Studio',
  location: '123 High Street, Downtown',
  date: '2026-05-18T14:30:00+05:30',
  timeSlot: '2:30 PM - 3:15 PM',
  status: 'Upcoming',
  totalPrice: 1200,
  barberName: 'Alex Mercer',
  barberTitle: 'Senior Stylist',
  services: [
    { id: 'classic-haircut', name: 'Classic Haircut', duration: '45 mins', price: 900 },
    { id: 'beard-finish', name: 'Beard Finish', duration: '15 mins', price: 300 },
  ] satisfies BookedService[],
};

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
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateString));
}

export const metadata: Metadata = {
  title: 'Booking Details',
};

export default function BookingPage() {
  return (
    <div className="w-full max-w-sm mx-auto min-h-screen bg-white relative">
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
                  {booking.timeSlot} ({booking.services[0].duration})
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
                {booking.barberName}
              </h2>
              <p className="mt-1 text-sm text-neutral-500">{booking.barberTitle}</p>
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
              className="w-full rounded-full bg-black px-5 py-4 text-base font-semibold text-white transition-opacity hover:opacity-95"
            >
              Reschedule
            </button>
            <button
              type="button"
              className="w-full rounded-full px-5 py-3 text-base font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              Cancel Booking
            </button>
          </div>
        </main>

        <MobileBottomNav />
      </div>
    </div>
  );
}
