'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function PhoneLoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');

  const handleContinue = () => {
    if (phone.length === 10) {
      router.push('/verify-otp');
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F3F3] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] min-h-[550px] rounded-[40px] bg-white p-8 shadow-sm flex flex-col">
        <div className="mt-4 mb-10">
          <h1 className="text-[48px] font-black tracking-tighter text-black">
            ZLon.
          </h1>
        </div>

        <div className="flex-1">
          <div className="flex h-16 items-center overflow-hidden rounded-2xl border border-transparent bg-[#F4F4F5] transition-all focus-within:border-gray-300 focus-within:bg-white">
            <div className="px-5 text-lg font-bold text-black flex-shrink-0">
              +91
            </div>
            <div className="h-8 w-px bg-gray-300" />
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))
              }
              placeholder="Enter phone number"
              className="h-full flex-1 bg-transparent px-4 text-lg font-medium text-black placeholder-gray-400 focus:outline-none"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleContinue}
          disabled={phone.length !== 10}
          className={`mt-auto w-full rounded-full py-4 text-lg font-bold transition-all ${
            phone.length === 10
              ? 'bg-black text-white shadow-md hover:bg-gray-800 active:scale-[0.98]'
              : 'cursor-not-allowed bg-gray-200 text-gray-400'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
