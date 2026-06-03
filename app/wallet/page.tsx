'use client';

import { useState, useEffect } from 'react';
import { WalletScreen } from '../components/wallet-screen';
import type { TransactionType, TransactionKind, Transaction } from '../components/wallet-screen';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { auth as firebaseAuth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

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
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let firebaseUnsubscribe: (() => void) | undefined;

    async function checkAuthAndLoad() {
      try {
        const supabase = createSupabaseClient();
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();

        if (!supabaseUser && firebaseAuth) {
          firebaseUnsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
            if (fbUser) {
              await loadWalletData(fbUser.uid);
            } else {
              router.push('/');
            }
          });
        } else if (supabaseUser) {
          await loadWalletData(supabaseUser.id);
        } else {
          router.push('/');
        }
      } catch (err) {
        console.error('Auth check error:', err);
        router.push('/');
      }
    }

    async function loadWalletData(userId: string) {
      try {
        const supabase = createSupabaseClient();
        const [{ data: walletData }, { data: bookingsData }] = await Promise.all([
          supabase.from('wallets').select('balance').eq('user_id', userId).maybeSingle(),
          supabase.from('bookings').select('id, total_amount, created_at, status, salons:salon_id(name)').eq('user_id', userId).eq('payment_method', 'wallet').order('created_at', { ascending: false }),
        ]);

        const initialBalance = walletData?.balance || 0;
        setBalance(initialBalance);

        const initialTransactions: Transaction[] = (bookingsData || []).map((booking: WalletBooking) => ({
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

    checkAuthAndLoad();

    return () => {
      if (firebaseUnsubscribe) firebaseUnsubscribe();
    };
  }, [router]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="w-full relative">
      <WalletScreen initialBalance={balance} initialTransactions={transactions} />
    </div>
  );
}
