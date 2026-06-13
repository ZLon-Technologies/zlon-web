'use client';

import { useState, useEffect } from 'react';
import { WalletScreen } from '../components/wallet-screen';
import type { TransactionType, TransactionKind, Transaction } from '../components/wallet-screen';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';

interface WalletBooking {
  id: string | number;
  total_amount: number | string;
  created_at: string;
  status: string;
  salons: { name: string }[];
}

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export default function WalletPage() {
  const { user, loading: authLoading } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadWalletData() {
      if (!user) {
        setIsLoading(false);
        return;
      }
      try {
        const userId = user.uid;
        
        const walletRef = doc(db, 'wallets', userId);
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('user_id', '==', userId),
          where('payment_method', '==', 'wallet'),
          orderBy('created_at', 'desc')
        );

        const [walletSnap, bookingsSnap] = await Promise.all([
          getDoc(walletRef),
          getDocs(bookingsQuery)
        ]);

        const walletData = walletSnap.exists() ? walletSnap.data() : null;
        const initialBalance = walletData?.balance || 0;
        setBalance(initialBalance);

        const bookingsData = bookingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as WalletBooking[];

        const initialTransactions: Transaction[] = bookingsData.map((booking: WalletBooking) => ({
          id: String(booking.id),
          title: booking.status === 'cancelled' ? `Refund for ${booking.salons?.[0]?.name || 'Booking'}` : `Paid for ${booking.salons?.[0]?.name || 'Booking'}`,
          meta: `${formatDateLabel(new Date(booking.created_at))} • ${booking.status === 'cancelled' ? 'Refunded' : 'Completed'}`,
          amount: Number(booking.total_amount),
          type: (booking.status === 'cancelled' ? 'credit' : 'debit') as TransactionType,
          kind: (booking.status === 'cancelled' ? 'refund' : 'booking') as TransactionKind,
        }));
        setTransactions(initialTransactions);
      } catch (error) {
        console.error('Error loading wallet data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading) {
      if (!user) {
        router.push('/');
      } else {
        loadWalletData();
      }
    }
  }, [user, authLoading, router]);

  if (authLoading || isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="w-full relative">
      <WalletScreen initialBalance={balance} initialTransactions={transactions} />
    </div>
  );
}
