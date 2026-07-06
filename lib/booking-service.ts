import { db } from './firebase';
import { 
  doc, 
  collection, 
  runTransaction, 
  increment,
  serverTimestamp 
} from 'firebase/firestore';

export interface ServiceDetails {
  id: string;
  name: string;
  duration?: number;
  [key: string]: any;
}

/**
 * Handles a salon booking transaction.
 * Deducts the booking amount from the user's wallet and creates a booking record atomically.
 */
export async function createSalonBooking(
  userId: string,
  salonId: string,
  serviceDetails: ServiceDetails[],
  bookingAmount: number
) {
  try {
    const bookingId = await runTransaction(db, async (transaction) => {
      // 1. Reference to the user's document
      const userRef = doc(db, 'users', userId);
      
      // 2. Read the user document first (Reads must come before writes in transactions)
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const currentBalance = userData.walletBalance || 0;

      // 3. Check for sufficient funds
      if (currentBalance < bookingAmount) {
        throw new Error('Insufficient balance');
      }

      // 4. Reference for the new booking document (automatically generates an ID)
      const newBookingRef = doc(collection(db, 'bookings'));

      // 5. Deduct funds using increment(-amount)
      transaction.update(userRef, {
        walletBalance: increment(-bookingAmount)
      });

      // 6. Create the new booking document
      transaction.set(newBookingRef, {
        userId,
        salonId,
        serviceDetails,
        bookingAmount,
        status: 'confirmed',
        createdAt: serverTimestamp(),
      });

      return newBookingRef.id;
    });

    return { success: true, bookingId };
  } catch (error) {
    console.error('Booking transaction failed:', error);
    throw error;
  }
}
