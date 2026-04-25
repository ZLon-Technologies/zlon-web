import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CalendarDays,
  Clock3,
  Info,
  MapPin,
  MessageSquareMore,
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
  'rounded-[2rem] border border-black/10 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]';

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
    <div className="bg-[#f7f6f3] text-neutral-950">
      <div className="mx-auto flex min-h-screen max-w-md flex-col">
        <header className="border-b border-black/6 px-6 py-8">
          <button
            type="button"
            aria-label="Booking information"
            className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-black bg-white text-black"
          >
            <Info className="h-6 w-6" strokeWidth={2.3} />
          </button>
        </header>

        <main className="flex-1 space-y-6 px-6 pb-10 pt-6">
          <section className="overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_45px_rgba(15,23,42,0.15)]">
            <div
              className="relative h-[32rem] overflow-hidden rounded-[2rem] bg-cover bg-center"
              style={{
                backgroundImage:
                  'linear-gradient(180deg, rgba(17,24,39,0.05) 10%, rgba(17,24,39,0.72) 100%), url("https://images.unsplash.com/photo-1585747860715-cd4628902d4a?auto=format&fit=crop&w=1200&q=80")',
              }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,transparent_24%,rgba(17,24,39,0.7)_100%)]" />

              <div className="absolute left-6 top-6">
                <span className="rounded-full bg-white px-4 py-2 text-base font-medium text-neutral-500 shadow-sm">
                  {booking.status}
                </span>
              </div>

              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-base text-white/85">{booking.salonName}</p>
                <h1 className="mt-2 text-[3.35rem] font-semibold leading-none tracking-tight text-white">
                  {booking.serviceTitle}
                </h1>
                <p className="mt-3 max-w-xs text-lg text-white/80">{booking.location}</p>
              </div>
            </div>
          </section>

          <section className={`${surfaceClass} flex items-center gap-5 p-5`}>
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
              <CalendarDays className="h-8 w-8" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <p className="text-xl text-neutral-500">Date &amp; Time</p>
              <h2 className="mt-1 text-3xl font-semibold tracking-tight">
                {formatBookingDate(booking.date)}
              </h2>
              <div className="mt-2 flex items-center gap-2 text-lg text-neutral-500">
                <Clock3 className="h-5 w-5" strokeWidth={2.1} />
                <span>
                  {booking.timeSlot} ({booking.services[0].duration})
                </span>
              </div>
            </div>
          </section>

          <section className={`${surfaceClass} flex items-center gap-4 p-5`}>
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,#f6c89f_12%,#de9567_24%,#111827_25%,#111827_100%)] text-lg font-semibold text-white">
              AM
            </div>
            <div className="flex-1">
              <p className="text-xl text-neutral-500">Professional</p>
              <h2 className="mt-1 text-3xl font-semibold tracking-tight">
                {booking.barberName}
              </h2>
              <p className="mt-1 text-lg text-neutral-500">{booking.barberTitle}</p>
            </div>
            <button
              type="button"
              aria-label="Message stylist"
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200"
            >
              <MessageSquareMore className="h-6 w-6" strokeWidth={2.1} />
            </button>
          </section>

          <section className={`${surfaceClass} flex items-center gap-4 p-5`}>
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
              <MapPin className="h-8 w-8" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xl text-neutral-500">Location</p>
              <h2 className="mt-1 text-3xl font-semibold tracking-tight">{booking.location}</h2>
              <Link
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  booking.location
                )}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-xl text-neutral-500 underline-offset-4 hover:underline"
              >
                Get Directions
              </Link>
            </div>
            <div className="h-28 w-28 shrink-0 rounded-[1.7rem] bg-[linear-gradient(135deg,#9ecf99_0%,#80be89_35%,#8fcbbe_35%,#8fcbbe_70%,#f0b35f_70%,#d4a55f_100%)] bg-[length:200%_200%] shadow-inner" />
          </section>

          <section className={`${surfaceClass} p-5`}>
            <h2 className="text-3xl font-semibold tracking-tight">Services Booked</h2>
            <div className="mt-5 space-y-4">
              {booking.services.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center gap-4 rounded-[1.5rem] bg-[#f4f3f0] px-4 py-4"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-neutral-700 shadow-sm">
                    <Scissors className="h-5 w-5" strokeWidth={2.1} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-semibold tracking-tight">{service.name}</h3>
                    <p className="mt-1 text-sm text-neutral-500">{service.duration}</p>
                  </div>
                  <div className="text-lg font-semibold text-neutral-950">
                    {formatCurrency(service.price)}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={`${surfaceClass} p-5`}>
            <h2 className="text-3xl font-semibold tracking-tight">Payment Summary</h2>
            <div className="mt-6 space-y-5 text-xl">
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
              <div className="flex items-center justify-between gap-4 text-3xl font-semibold tracking-tight">
                <span>Total</span>
                <span>{formatCurrency(booking.totalPrice)}</span>
              </div>
            </div>
          </section>

          <div className="space-y-3 pt-2">
            <Link
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                booking.location
              )}`}
              target="_blank"
              rel="noreferrer"
              className="block w-full rounded-full border border-black/40 px-5 py-4 text-center text-2xl font-semibold text-neutral-900 transition-colors hover:bg-neutral-50"
            >
              Get Directions
            </Link>
            <button
              type="button"
              className="w-full rounded-full bg-black px-5 py-4 text-2xl font-semibold text-white transition-transform hover:scale-[1.01]"
            >
              Reschedule
            </button>
            <button
              type="button"
              className="w-full rounded-full px-5 py-3 text-2xl font-medium text-red-600 transition-colors hover:bg-red-50"
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
