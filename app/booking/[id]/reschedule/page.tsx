export const generateStaticParams = () => [];

import { redirect } from 'next/navigation';

interface RescheduleBookingPageProps {
  params: Promise<{ id: string }>;
}

export default async function RescheduleBookingPage({ params }: RescheduleBookingPageProps) {
  const { id } = await params;
  redirect(`/bookings/${id}/reschedule`);
}
