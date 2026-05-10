'use client';

import { use } from 'react';
import { SelectServicesScreen } from '../../components/select-services-screen';

interface SalonServicesClientProps {
  salonId: string;
}

export function SalonServicesClient({ salonId }: SalonServicesClientProps) {
  return <SelectServicesScreen salonId={salonId} />;
}
