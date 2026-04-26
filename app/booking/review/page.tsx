import type { Metadata } from 'next';
import { ReviewBookingScreen } from '../../components/review-booking-screen';
import { getSalonById, getServicesForSalon } from '../../lib/booking-flow';

export const metadata: Metadata = {
  title: 'Review Booking',
};

interface ReviewBookingPageProps {
  searchParams: Promise<{
    salon?: string;
    services?: string;
    date?: string;
    slot?: string;
  }>;
}

export default async function ReviewBookingPage({ searchParams }: ReviewBookingPageProps) {
  const params = await searchParams;
  const salon = getSalonById(params.salon ?? 'velvet-vine');
  const selectedServiceIds = (params.services ?? '')
    .split(',')
    .map((serviceId) => serviceId.trim())
    .filter(Boolean);
  const selectedServices = getServicesForSalon(salon, selectedServiceIds);

  return (
    <ReviewBookingScreen
      salon={salon}
      selectedServices={selectedServices}
      selectedDate={params.date ?? '2026-10-23'}
      selectedSlot={params.slot ?? '10:00 AM'}
    />
  );
}
