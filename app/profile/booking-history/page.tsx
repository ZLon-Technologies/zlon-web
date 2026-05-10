import type { Metadata } from 'next';
import { BookingHistoryScreen } from './booking-history-screen';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Booking History',
};

export default function ProfileBookingHistoryPage() {
  return <BookingHistoryScreen />;
}
