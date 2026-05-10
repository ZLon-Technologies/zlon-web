'use client';

import { use } from 'react';
import { SalonProfileClient } from '../../salon-profile/[id]/salon-profile-client';

interface SalonProfilePageClientProps {
  salonId: string;
}

export function SalonProfilePageClient({ salonId }: SalonProfilePageClientProps) {
  return <SalonProfileClient salonId={salonId} />;
}
