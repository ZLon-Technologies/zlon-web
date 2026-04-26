import type { Metadata } from 'next';
import { ChooseSlotScreen } from '../../components/choose-slot-screen';
import { getSalonById, getServicesForSalon } from '../../lib/booking-flow';

export const metadata: Metadata = {
  title: 'Choose Slot',
};

interface ChooseSlotPageProps {
  searchParams: Promise<{
    salon?: string;
    services?: string;
  }>;
}

export default async function ChooseSlotPage({ searchParams }: ChooseSlotPageProps) {
  const params = await searchParams;
  const salon = getSalonById(params.salon ?? 'velvet-vine');
  const selectedServiceIds = (params.services ?? '')
    .split(',')
    .map((serviceId) => serviceId.trim())
    .filter(Boolean);
  const selectedServices = getServicesForSalon(salon, selectedServiceIds);

  return <ChooseSlotScreen salon={salon} selectedServices={selectedServices} />;
}
