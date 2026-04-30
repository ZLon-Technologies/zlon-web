import type { Metadata } from 'next';
import { ChooseSlotScreen } from '../../components/choose-slot-screen';
import { getSalonById, getServicesForSalon, parseSelectedServices } from '../../lib/booking-flow';

export const metadata: Metadata = {
  title: 'Choose Slot',
};

interface ChooseSlotPageProps {
  searchParams: Promise<{
    salon?: string;
    services?: string;
    cart?: string;
    totalPrice?: string;
    totalDuration?: string;
  }>;
}

export default async function ChooseSlotPage({ searchParams }: ChooseSlotPageProps) {
  const params = await searchParams;
  const salon = getSalonById(params.salon ?? 'velvet-vine');
  const selectedServiceIds = (params.services ?? '')
    .split(',')
    .map((serviceId) => serviceId.trim())
    .filter(Boolean);
  const cartServices = parseSelectedServices(params.cart);
  const selectedServices =
    cartServices.length > 0 ? cartServices : getServicesForSalon(salon, selectedServiceIds);

  return <ChooseSlotScreen salon={salon} selectedServices={selectedServices} />;
}
