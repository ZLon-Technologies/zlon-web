import type { Metadata } from 'next';
import { BookingCompleteScreen } from '../../components/booking-complete-screen';
import { getSalonById, getServicesForSalon, parseSelectedServices } from '../../lib/booking-flow';

export const metadata: Metadata = {
  title: 'Booking Complete',
};

interface BookingCompletePageProps {
  searchParams: Promise<{
    salon?: string;
    services?: string;
    cart?: string;
    totalPrice?: string;
    totalDuration?: string;
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
  const cartServices = parseSelectedServices(params.cart);
  const selectedServices =
    cartServices.length > 0 ? cartServices : getServicesForSalon(salon, selectedServiceIds);
  const total =
    Number(params.total) ||
    selectedServices.reduce((sum, service) => sum + service.price, 0);

  return (
    <BookingCompleteScreen
      salon={salon}
      selectedServices={selectedServices}
      selectedDate={params.date ?? '2026-10-23'}
      selectedSlot={params.slot ?? '10:00 AM'}
      total={total}
      paymentMethod={params.payment ?? 'wallet'}
    />
  );
}
