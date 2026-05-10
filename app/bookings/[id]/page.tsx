import type { Metadata } from 'next';
import { BookingDetailClient } from './booking-detail-client';

interface BookingDetailPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Booking Details',
};

export function generateStaticParams(): Array<{ id: string }> {
  return [{ id: 'placeholder' }];
}

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {
  const { id } = await params;
  return <BookingDetailClient bookingId={id} />;
}
