import type { Metadata } from 'next';
import { SalonServicesClient } from './salon-services-client';

interface SalonServicesPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-static';

export async function generateMetadata({ params }: SalonServicesPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Book at ${id}`,
  };
}

export function generateStaticParams(): Array<{ id: string }> {
  return [{ id: 'placeholder' }];
}

export default async function SalonServicesPage({ params }: SalonServicesPageProps) {
  const { id } = await params;
  return <SalonServicesClient salonId={id} />;
}
