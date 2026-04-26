import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SalonDetailScreen } from '../../components/salon-detail-screen';
import { getSalonById } from '../../lib/salons';

export const metadata: Metadata = {
  title: 'Salon Detail',
};

interface SalonDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SalonDetailPage({ params }: SalonDetailPageProps) {
  const { id } = await params;
  const salon = getSalonById(id);

  if (!salon) {
    notFound();
  }

  return <SalonDetailScreen salon={salon} />;
}
