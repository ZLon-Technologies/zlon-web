import type { Metadata } from 'next';
import { SelectServicesScreen } from '../../components/select-services-screen';

export const metadata: Metadata = {
  title: 'Services',
};

interface SalonServicesPageProps {
  params: Promise<{ id: string }>;
}

export default async function SalonServicesPage({ params }: SalonServicesPageProps) {
  const { id } = await params;

  return <SelectServicesScreen salonId={id} />;
}
