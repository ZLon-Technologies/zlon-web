import type { Metadata } from 'next';
import { BookingCompleteScreen } from '../../components/booking-complete-screen';
import { generateBookingId, getSalonById, getServicesForSalon } from '../../lib/booking-flow';

export const metadata: Metadata = {
  title: 'Booking Complete',
};

interface BookingCompletePageProps {
  searchParams: Promise<{
    salon?: string;
    services?: string;
    date?: string;
    slot?: string;
    total?: string;
    payment?: 'wallet' | 'pay-at-salon';
  }>;
}

export default async function BookingCompletePage({
  searchParams,
}: BookingCompletePageProps) {
  const params = await searchParams;
  const salon = getSalonById(params.salon ?? 'velvet-vine');
  const selectedServiceIds = (params.services ?? '')
    .split(',')
    .map((serviceId) => serviceId.trim())
    .filter(Boolean);
  const selectedServices = getServicesForSalon(salon, selectedServiceIds);
  const total =
    Number(params.total) ||
    selectedServices.reduce((sum, service) => sum + service.price, 0);
  const bookingId = generateBookingId(
    `${salon.id}-${params.date ?? '2026-10-23'}-${params.slot ?? '10:00 AM'}-${total}`
  );

  return (
    <BookingCompleteScreen
      salon={salon}
      selectedServices={selectedServices}
      selectedDate={params.date ?? '2026-10-23'}
      selectedSlot={params.slot ?? '10:00 AM'}
      total={total}
      bookingId={bookingId}
      paymentMethod={params.payment ?? 'wallet'}
    />
  );
}
