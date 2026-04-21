'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  const handleContinue = () => {
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    if (digitsOnly.length !== 10) {
      console.warn('Please enter a valid 10-digit phone number.');
      return;
    }
    console.log('Continuing with:', digitsOnly);
    router.push('/verify-otp');
  };

  const [phoneNumber, setPhoneNumber] = useState('');

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F3F3F3]">
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl flex flex-col p-8 min-h-[700px] relative">

        <div className="flex-1 mt-8">
          <h1 className="text-4xl font-bold text-black mb-10 tracking-tight">ZLon.</h1>

          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-gray-500 font-medium text-lg">+91</span>
            </div>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter phone number"
              className="w-full pl-16 pr-4 py-4 rounded-xl border border-gray-200 text-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder:text-gray-400"
            />
          </div>
        </div>

        <button
          onClick={handleContinue}
          className="w-full bg-black text-white rounded-xl py-4 text-lg font-medium hover:bg-gray-800 transition-colors mt-auto mb-4"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
