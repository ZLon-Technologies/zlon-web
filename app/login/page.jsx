'use client';

import { useState } from 'react';

function GoogleIcon({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function EmailIcon({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M22 6l-10 7L2 6"/>
    </svg>
  );
}

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('');

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white">
      <div className="w-full max-w-md bg-white rounded-[24px] shadow-2xl flex flex-col p-8 relative min-h-[700px]">
        <h1 className="text-3xl font-bold text-black mb-2">ZLon.</h1>
        <p className="text-sm text-gray-500 mb-8">Welcome Back</p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <div className="relative bg-[#F5F5F5] rounded-xl border border-gray-200">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-900 font-medium">
              +1
            </span>
            <input
              type="tel"
              placeholder="555 000-0000"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-transparent rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-black placeholder:text-gray-400"
            />
          </div>
        </div>

        <button className="w-full bg-black text-white rounded-full py-4 text-lg font-medium hover:bg-gray-900 transition-colors mb-6">
          Continue
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-400 font-medium">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="flex gap-4 mb-8">
          <button className="flex-1 flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 rounded-full py-4 transition-colors border border-gray-200">
            <GoogleIcon className="h-5 w-5" />
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 rounded-full py-4 transition-colors border border-gray-200">
            <EmailIcon className="h-5 w-5" />
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-auto">
          Don&apos;t have an account?{' '}
          <a href="#" className="font-semibold text-black hover:underline">
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
}
