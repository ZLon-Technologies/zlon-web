import * as admin from 'firebase-admin';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onRequest } from 'firebase-functions/v2/https';

// Initialize the Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

/**
 * 1. Automatically handle wallet refunds when a ZLon booking is canceled.
 * Listens to updates on the bookings/{bookingId} collection.
 */
export const onBookingCancelled = onDocumentUpdated(
  'bookings/{bookingId}',
  async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    // Ensure we have data to compare
    if (!beforeData || !afterData) {
      return;
    }

    const previousStatus = beforeData.status;
    const currentStatus = afterData.status;

    // Check if the status transitioned to 'cancelled' and wasn't already 'cancelled'
    if (previousStatus !== 'cancelled' && currentStatus === 'cancelled') {
      const { bookingAmount, userId } = afterData;

      if (!userId || typeof bookingAmount !== 'number') {
        console.error('Invalid or missing userId/bookingAmount in the document data');
        return;
      }

      const userRef = db.collection('users').doc(userId);

      try {
        await db.runTransaction(async (transaction) => {
          const userDoc = await transaction.get(userRef);
          
          if (!userDoc.exists) {
            console.error(`User ${userId} not found for refund`);
            return;
          }

          // Safely increment the user's walletBalance by the bookingAmount
          transaction.update(userRef, {
            walletBalance: admin.firestore.FieldValue.increment(bookingAmount)
          });
        });

        console.log(`Successfully refunded ${bookingAmount} to user ${userId} for cancelled booking`);
      } catch (error) {
        console.error('Error processing refund transaction:', error);
      }
    }
  }
);

/**
 * 2. Secure HTTPS webhook callback for handling wallet recharges from the ZLon mobile app.
 * Accepts a POST request and updates the user's wallet securely.
 */
export const rechargeWallet = onRequest(async (req, res) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
    return;
  }

  // --- Security Validation ---
  // Note: Implement robust authorization here. e.g., checking a webhook secret or a verified Firebase Auth token.
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Unauthorized: Missing or invalid token' });
    return;
  }
  
  // const token = authHeader.split('Bearer ')[1];
  // if (token !== process.env.WEBHOOK_SECRET) {
  //   res.status(403).json({ success: false, error: 'Forbidden' });
  //   return;
  // }

  try {
    const { userId, rechargeAmount, transactionId } = req.body;

    // Validate request payload
    if (!userId || rechargeAmount === undefined || !transactionId) {
      res.status(400).json({ success: false, error: 'Missing required parameters: userId, rechargeAmount, or transactionId' });
      return;
    }

    const amount = Number(rechargeAmount);
    if (isNaN(amount) || amount <= 0) {
      res.status(400).json({ success: false, error: 'Invalid recharge amount' });
      return;
    }

    const userRef = db.collection('users').doc(userId);
    // Using transactionId as the document ID ensures idempotency (prevents duplicate processing)
    const transactionRef = db.collection('wallet_transactions').doc(transactionId);
    
    let newBalance = 0;

    await db.runTransaction(async (transaction) => {
      // 1. Check if we've already processed this transaction
      const transactionDoc = await transaction.get(transactionRef);
      if (transactionDoc.exists) {
        throw new Error('Transaction already processed');
      }

      // 2. Verify the user exists
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const currentBalance = userDoc.data()?.walletBalance || 0;
      newBalance = currentBalance + amount;

      // 3. Credit the user's wallet
      transaction.update(userRef, {
        walletBalance: admin.firestore.FieldValue.increment(amount)
      });

      // 4. Record the credit transaction
      transaction.set(transactionRef, {
        userId,
        amount,
        type: 'credit',
        transactionId,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    res.status(200).json({ success: true, newBalance });

  } catch (error: any) {
    console.error('Error processing wallet recharge:', error);
    
    if (error.message === 'Transaction already processed') {
      res.status(409).json({ success: false, error: error.message });
    } else if (error.message === 'User not found') {
      res.status(404).json({ success: false, error: error.message });
    } else {
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }
});
