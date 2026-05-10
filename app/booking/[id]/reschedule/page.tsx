import type { Metadata } from 'next';
import { RescheduleBookingForm } from './reschedule-booking-form';

interface RescheduleBookingPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Reschedule Booking',
};

export function generateStaticParams(): Array<{ id: string }> {
  return [{ id: 'placeholder' }];
}

export default async function RescheduleBookingPage({ params }: RescheduleBookingPageProps) {
  const { id } = await params;
  return <RescheduleBookingForm bookingId={id} />;
}
