'use client';

export const generateStaticParams = () => [];

import { use } from 'react';
import { SelectServicesScreen } from '../../components/select-services-screen';

interface SalonServicesPageProps {
  params: Promise<{ id: string }>;
}

export default function SalonServicesPage({ params }: SalonServicesPageProps) {
  const { id } = use(params);

  return <SelectServicesScreen salonId={id} />;
}
