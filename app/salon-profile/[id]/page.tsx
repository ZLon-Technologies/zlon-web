import type { Metadata } from 'next';
import { SalonProfilePageClient } from './salon-profile-page-client';

interface SalonProfilePageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-static';

export async function generateMetadata({ params }: SalonProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Salon ${id}`,
  };
}

export function generateStaticParams(): Array<{ id: string }> {
  return [{ id: 'placeholder' }];
}

export default async function SalonProfilePage({ params }: SalonProfilePageProps) {
  const { id } = await params;
  return <SalonProfilePageClient salonId={id} />;
}
