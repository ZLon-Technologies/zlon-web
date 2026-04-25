'use client';

import { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CirclePlus,
  Info,
  Scissors,
  Star,
  Wallet,
} from 'lucide-react';
import { MobileBottomNav } from './mobile-bottom-nav';

type TransactionType = 'credit' | 'debit';
type TransactionKind = 'topup' | 'booking' | 'refund';

interface Transaction {
  id: string;
  title: string;
  meta: string;
  amount: number;
  type: TransactionType;
  kind: TransactionKind;
}

const initialBalance = 2450;
const presetAmounts = [100, 500, 1000] as const;

const initialTransactions: Transaction[] = [
  {
    id: 'booking-classic-haircut',
    title: 'Paid for Classic Haircut',
    meta: 'Today, 10:30 AM • Completed',
    amount: 1200,
    type: 'debit',
    kind: 'booking',
  },
  {
    id: 'refund-beard-trim',
    title: 'Refund for Beard Trim',
    meta: 'Yesterday, 2:15 PM • Processed',
    amount: 300,
    type: 'credit',
    kind: 'refund',
  },
  {
    id: 'topup-upi',
    title: 'Added Money via UPI',
    meta: 'Apr 22, 09:00 AM • Success',
    amount: 1000,
    type: 'credit',
    kind: 'topup',
  },
  {
    id: 'booking-facial-cleanup',
    title: 'Paid for Facial Cleanup',
    meta: 'Apr 20, 5:45 PM • Completed',
    amount: 650,
    type: 'debit',
    kind: 'booking',
  },
];

const surfaceClass =
  'rounded-[2rem] border border-black/10 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function transactionIcon(kind: TransactionKind, type: TransactionType) {
  if (kind === 'booking') {
    return {
      Icon: Scissors,
      wrapperClass: 'bg-rose-100 text-rose-700',
    };
  }

  if (kind === 'refund') {
    return {
      Icon: ArrowDownLeft,
      wrapperClass: 'bg-emerald-100 text-emerald-700',
    };
  }

  return {
    Icon: type === 'credit' ? ArrowDownLeft : ArrowUpRight,
    wrapperClass: 'bg-neutral-100 text-neutral-700',
  };
}

export function WalletScreen() {
  const [currentBalance, setCurrentBalance] = useState(initialBalance);
  const [amount, setAmount] = useState('500');
  const [transactions, setTransactions] = useState(initialTransactions);

  const rechargeAmount = useMemo(() => {
    const parsedValue = Number(amount);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
  }, [amount]);

  function scrollToSection(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  function handleRecharge(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!rechargeAmount) {
      return;
    }

    setCurrentBalance((previousBalance) => previousBalance + rechargeAmount);
    setTransactions((previousTransactions) => [
      {
        id: `wallet-topup-${Date.now()}`,
        title: 'Added Money via Wallet Recharge',
        meta: 'Just now • Success',
        amount: rechargeAmount,
        type: 'credit',
        kind: 'topup',
      },
      ...previousTransactions,
    ]);
    setAmount('');
  }

  return (
    <div className="bg-[#f7f6f3] text-neutral-950">
      <div className="mx-auto flex min-h-screen max-w-md flex-col">
        <header className="border-b border-black/6 px-6 py-8">
          <button
            type="button"
            aria-label="Wallet information"
            className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-black bg-white text-black"
          >
            <Info className="h-6 w-6" strokeWidth={2.3} />
          </button>
        </header>

        <main className="flex-1 space-y-6 px-6 pb-10 pt-6">
          <section className="rounded-[2rem] bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.12),_transparent_30%),linear-gradient(135deg,#020202_0%,#171717_55%,#111827_100%)] p-6 text-white shadow-[0_20px_45px_rgba(0,0,0,0.2)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-white/70">
                  Current Balance
                </p>
                <h1 className="mt-4 text-6xl font-semibold tracking-tight">
                  {formatCurrency(currentBalance)}
                </h1>
                <p className="mt-3 max-w-xs text-sm leading-6 text-white/70">
                  Keep funds ready for quick salon bookings, cancellations, and instant refunds.
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <Wallet className="h-6 w-6" strokeWidth={2.2} />
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => scrollToSection('recharge-section')}
                className="rounded-full bg-white px-5 py-4 text-lg font-semibold text-black transition-transform hover:scale-[1.01]"
              >
                + Top Up
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('history-section')}
                className="rounded-full bg-white/18 px-5 py-4 text-lg font-semibold text-white transition-colors hover:bg-white/24"
              >
                History
              </button>
            </div>
          </section>

          <section className={`${surfaceClass} flex items-center justify-between gap-4 p-5`}>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
                <Star className="h-8 w-8" strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Earned Points</h2>
                <p className="mt-1 text-base text-neutral-500">450 points available to redeem</p>
              </div>
            </div>
            <button
              type="button"
              className="rounded-full border border-black/40 px-6 py-3 text-xl font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
            >
              Redeem
            </button>
          </section>

          <section id="recharge-section" className={`${surfaceClass} p-5`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight">Add Money</h2>
                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  Top up your wallet instantly with preset amounts or a custom value.
                </p>
              </div>
              <div className="hidden h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-700 sm:flex">
                <CirclePlus className="h-7 w-7" strokeWidth={2} />
              </div>
            </div>

            <form onSubmit={handleRecharge} className="mt-6 space-y-5">
              <label htmlFor="wallet-amount" className="block text-sm font-medium text-neutral-500">
                Recharge amount
              </label>
              <div className="flex items-center gap-3 rounded-[1.75rem] bg-[#f4f3f0] px-4 py-4 ring-1 ring-black/5">
                <span className="text-2xl font-semibold text-neutral-500">₹</span>
                <input
                  id="wallet-amount"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(event) =>
                    setAmount(event.target.value.replace(/[^\d]/g, '').slice(0, 5))
                  }
                  placeholder="Enter amount"
                  className="w-full bg-transparent text-2xl font-semibold text-neutral-950 outline-none placeholder:text-neutral-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {presetAmounts.map((presetAmount) => {
                  const selected = amount === String(presetAmount);

                  return (
                    <button
                      key={presetAmount}
                      type="button"
                      onClick={() => setAmount(String(presetAmount))}
                      aria-pressed={selected}
                      className={`rounded-full border px-4 py-3 text-base font-semibold transition-all ${
                        selected
                          ? 'border-black bg-black text-white'
                          : 'border-black/10 bg-white text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      ₹{presetAmount}
                    </button>
                  );
                })}
              </div>

              <button
                type="submit"
                disabled={!rechargeAmount}
                className="w-full rounded-full bg-black px-5 py-4 text-lg font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              >
                Recharge Wallet
              </button>
            </form>
          </section>

          <section id="history-section" className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-4xl font-semibold tracking-tight">Transaction History</h2>
              <button
                type="button"
                className="text-base font-medium text-neutral-500 transition-colors hover:text-neutral-900"
              >
                View All
              </button>
            </div>

            <div className="space-y-4">
              {transactions.map((transaction) => {
                const { Icon, wrapperClass } = transactionIcon(
                  transaction.kind,
                  transaction.type
                );

                return (
                  <article
                    key={transaction.id}
                    className={`${surfaceClass} flex items-center gap-4 p-5`}
                  >
                    <div
                      className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${wrapperClass}`}
                    >
                      <Icon className="h-7 w-7" strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-2xl font-semibold tracking-tight">
                        {transaction.title}
                      </h3>
                      <p className="mt-1 text-base text-neutral-500">{transaction.meta}</p>
                    </div>
                    <div
                      className={`text-2xl font-semibold tracking-tight ${
                        transaction.type === 'credit' ? 'text-emerald-600' : 'text-neutral-950'
                      }`}
                    >
                      {transaction.type === 'credit' ? '+' : '-'}
                      {formatCurrency(transaction.amount).replace('₹', '₹')}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </main>

        <MobileBottomNav />
      </div>
    </div>
  );
}
