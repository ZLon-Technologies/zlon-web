import type { Metadata } from 'next';
import { WalletScreen } from '../components/wallet-screen';
import type { TransactionType, TransactionKind, Transaction } from '../components/wallet-screen';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Wallet',
};

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export default async function WalletPage() {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    redirect('/');
  }

  const userId = authData.user.id;

  const [{ data: walletData }, { data: bookingsData }] = await Promise.all([
    supabase.from('wallets').select('balance').eq('user_id', userId).maybeSingle(),
    supabase.from('bookings').select('id, total_amount, created_at, status, salons:salon_id(name)').eq('customer_id', userId).eq('payment_method', 'wallet').order('created_at', { ascending: false }),
  ]);

  const initialBalance = walletData?.balance || 0;
  
  const initialTransactions: Transaction[] = (bookingsData || []).map((booking: any) => ({
    id: String(booking.id),
    title: booking.status === 'cancelled' ? `Refund for ${booking.salons?.name || 'Booking'}` : `Paid for ${booking.salons?.name || 'Booking'}`,
    meta: `${formatDateLabel(new Date(booking.created_at))} • ${booking.status === 'cancelled' ? 'Refunded' : 'Completed'}`,
    amount: Number(booking.total_amount),
    type: (booking.status === 'cancelled' ? 'credit' : 'debit') as TransactionType,
    kind: (booking.status === 'cancelled' ? 'refund' : 'booking') as TransactionKind,
  }));

  return (
    <div className="w-full relative">
      <WalletScreen initialBalance={initialBalance} initialTransactions={initialTransactions} />
    </div>
  );
}
