import type { Metadata } from 'next';
import { BookingHistoryScreen } from './booking-history-screen';
import { getPastBookings, getUserBookings } from '../../lib/bookings-data';

export const metadata: Metadata = {
  title: 'Booking History',
};

export default async function ProfileBookingHistoryPage() {
  const bookings = await getUserBookings();
  const pastBookings = getPastBookings(bookings);

  return <BookingHistoryScreen initialBookings={pastBookings} />;
}
