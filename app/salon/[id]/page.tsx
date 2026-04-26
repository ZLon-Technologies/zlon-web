import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SelectServicesScreen } from '../../components/select-services-screen';
import { getSalonById } from '../../lib/booking-flow';

export const metadata: Metadata = {
  title: 'Services',
};

interface SalonServicesPageProps {
  params: Promise<{ id: string }>;
}

export default async function SalonServicesPage({ params }: SalonServicesPageProps) {
  const { id } = await params;
  const salon = getSalonById(id);

  if (!salon) {
    notFound();
  }

  return <SelectServicesScreen salon={salon} />;
}
