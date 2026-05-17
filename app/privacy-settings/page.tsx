'use client';

import type { Metadata } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, KeyRound } from 'lucide-react';

export default function PrivacySettingsPage() {
  const router = useRouter();

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50 font-sans antialiased">
      {/* Forced Header Padding for Notch Clearance */}
      <header className="flex-none bg-white border-b px-4 pb-4 pt-12 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-neutral-50"
          aria-label="Go back"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">Security</h1>
      </header>

      {/* Redesigned iOS-Style Button Area */}
      <main className="flex-1 px-0">
        <div className="px-4">
          <button
            onClick={() => router.push('/change-password')}
            className="bg-white rounded-2xl w-full p-4 flex items-center justify-between shadow-sm active:scale-95 transition-all mt-6"
          >
            <div className="flex items-center gap-4">
              <div className="bg-gray-100 p-2 rounded-full text-gray-600">
                <KeyRound size={20} strokeWidth={2.5} />
              </div>
              <span className="text-base font-semibold text-gray-900">Change Password</span>
            </div>
            <ChevronRight size={20} className="text-gray-400" strokeWidth={2.5} />
          </button>
        </div>
      </main>
    </div>
  );
}
