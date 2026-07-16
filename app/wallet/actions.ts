'use server';

import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { Timestamp } from 'firebase-admin/firestore';

interface BookingMutationResult {
  ok: boolean;
  message: string;
}

async function getAuthenticatedUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('firebase-auth-token')?.value;

    if (!token) return null;

    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    console.error('Authentication Error:', error);
    return null;
  }
}

export async function rechargeWallet(amount: number): Promise<BookingMutationResult> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { ok: false, message: 'User not authenticated.' };

    const walletRef = adminDb.collection('wallets').doc(userId);
    const walletDoc = await walletRef.get();

    if (!walletDoc.exists) {
      await walletRef.set({
        uid: userId,
        balance: amount,
        updatedAt: Timestamp.now(),
      });
    } else {
      const currentBalance = walletDoc.data()?.balance || 0;
      await walletRef.update({
        balance: currentBalance + amount,
        updatedAt: Timestamp.now(),
      });
    }

    return { ok: true, message: 'Wallet recharged successfully.' };
  } catch (error: any) {
    console.error('Recharge Error:', error);
    return { ok: false, message: error.message || 'Failed to recharge wallet.' };
  }
}

export async function cancelBooking(bookingId: string): Promise<BookingMutationResult> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { ok: false, message: 'User not authenticated.' };

    const bookingRef = adminDb.collection('bookings').doc(bookingId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) return { ok: false, message: 'Booking not found.' };
    if (bookingDoc.data()?.userId !== userId) return { ok: false, message: 'Unauthorized.' };

    await bookingRef.update({
      status: 'cancelled',
      updatedAt: Timestamp.now(),
    });

    return { ok: true, message: 'Booking cancelled successfully.' };
  } catch (error: any) {
    console.error('Cancel Error:', error);
    return { ok: false, message: error.message || 'Failed to cancel booking.' };
  }
}

export async function rescheduleBooking(formData: FormData): Promise<BookingMutationResult> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { ok: false, message: 'User not authenticated.' };

    const bookingId = formData.get('bookingId') as string;
    const newDate = formData.get('date') as string;
    const newSlot = formData.get('slot') as string;

    if (!bookingId || !newDate || !newSlot) {
      return { ok: false, message: 'Missing required fields.' };
    }

    const bookingRef = adminDb.collection('bookings').doc(bookingId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) return { ok: false, message: 'Booking not found.' };
    if (bookingDoc.data()?.userId !== userId) return { ok: false, message: 'Unauthorized.' };

    await bookingRef.update({
      bookingDate: newDate,
      slot: newSlot,
      updatedAt: Timestamp.now(),
    });

    return { ok: true, message: 'Booking rescheduled successfully.' };
  } catch (error: any) {
    console.error('Reschedule Error:', error);
    return { ok: false, message: error.message || 'Failed to reschedule booking.' };
  }
}

export async function createBooking(formData: FormData): Promise<BookingMutationResult & { bookingId?: string }> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { ok: false, message: 'User not authenticated.' };

    const salonId = formData.get('salonId') as string;
    const serviceIds = formData.get('serviceId') as string;
    const date = formData.get('date') as string;
    const slot = formData.get('slot') as string;
    const staffId = formData.get('staffId') as string;
    const totalAmount = Number(formData.get('totalAmount'));
    const paymentMethod = formData.get('paymentMethod') as string;

    if (!salonId || !serviceIds || !date || !slot) {
      return { ok: false, message: 'Missing required fields.' };
    }

    const bookingRef = adminDb.collection('bookings').doc();
    const bookingId = bookingRef.id;
    const bookingDate = date ? Timestamp.fromDate(new Date(date)) : Timestamp.now();

    // Run atomically using a Firestore Transaction
    await adminDb.runTransaction(async (transaction) => {
      if (paymentMethod === 'wallet') {
        // Read the user document first (Reads must come before Writes)
        const userRef = adminDb.collection('users').doc(userId);
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists) {
          throw new Error('User document not found.');
        }

        const walletBalance = userDoc.data()?.walletBalance || 0;

        if (walletBalance < totalAmount) {
          throw new Error('Insufficient wallet balance.');
        }

        // Deduct the booking amount
        transaction.update(userRef, {
          walletBalance: walletBalance - totalAmount
        });
      }

      // Create the booking document
      transaction.set(bookingRef, {
        bookingId,
        userId,
        salonId,
        serviceIds: serviceIds.split(','),
        bookingDate,
        slot,
        staffId,
        totalAmount,
        paymentMethod,
        status: 'confirmed',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    });

    return { ok: true, message: 'Booking created successfully.', bookingId };
  } catch (error: any) {
    console.error('Create Booking Error:', error);
    return { ok: false, message: error.message || 'Failed to create booking.' };
  }
}
