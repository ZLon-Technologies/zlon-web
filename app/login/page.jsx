'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('');

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-100">
      <div className="w-full max-w-md bg-white sm:rounded-[40px] shadow-2xl flex flex-col p-8 relative min-h-[700px]">
        <h1 className="text-3xl font-bold text-zinc-900 mb-8">ZLon.</h1>

        <div className="relative mb-6">
          <input
            type="tel"
            placeholder="Enter phone number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-xl border border-zinc-200 text-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>

        <button
          onClick={() => console.log(phoneNumber)}
          className="w-full bg-zinc-900 text-white rounded-xl py-4 text-lg font-medium hover:bg-zinc-800 transition-colors mt-auto"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
