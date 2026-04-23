'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function PhoneLoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');

  const handleSendOtp = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (phone.length === 10) {
      router.push('/verify-otp');
    }
  };

  return (
    <div className="min-h-screen bg-white px-6 py-12 flex flex-col items-center justify-center">
      <div className="mb-10 text-center">
        <h1 className="text-[3.5rem] font-extrabold tracking-[-0.06em] leading-none text-black">
          ZLon.
        </h1>
      </div>

      <form
        onSubmit={handleSendOtp}
        className="w-full max-w-sm rounded-[2.5rem] bg-white px-7 py-8 shadow-[0_8px_30px_rgba(15,23,42,0.08)] sm:px-10 sm:py-10"
      >
        <h2 className="mb-8 text-center text-[2.15rem] font-bold tracking-[-0.04em] text-[#1F1F1F]">
          Welcome Back
        </h2>

        <div className="mb-6 flex gap-3">
          <div className="flex w-20 items-center justify-center rounded-2xl bg-[#F3F3F3] py-4 text-base font-medium text-[#232323]">
            +91
          </div>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={phone}
            onChange={(event) =>
              setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))
            }
            placeholder="Enter Number"
            className="flex-1 rounded-2xl bg-[#F3F3F3] px-5 py-4 text-base font-medium text-[#232323] placeholder:text-[#767676] focus:outline-none"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-2xl bg-black py-4 text-base font-semibold text-white shadow-[0_8px_18px_rgba(0,0,0,0.16)] transition-transform active:scale-[0.99]"
        >
          Send OTP
        </button>

        <div className="my-8 flex items-center">
          <div className="flex-grow border-t border-gray-200" />
          <span className="mx-4 text-xs font-medium tracking-[0.28em] text-gray-400">
            OR SIGN IN WITH
          </span>
          <div className="flex-grow border-t border-gray-200" />
        </div>

        <div className="mb-8 flex justify-center gap-8">
          <button
            type="button"
            aria-label="Continue with Google"
            className="text-black transition-transform hover:scale-[1.03] focus:outline-none"
          >
            <svg
              className="h-12 w-12"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M44 24.55c0-1.48-.13-2.9-.39-4.27H24v8.09h11.21c-.48 2.59-1.94 4.79-4.14 6.27v5.21h6.71C41.7 36.2 44 30.89 44 24.55Z"
                fill="#4285F4"
              />
              <path
                d="M24 45c5.63 0 10.35-1.87 13.8-5.08l-6.71-5.21c-1.86 1.25-4.24 2-7.09 2-5.45 0-10.07-3.68-11.72-8.64H5.35v5.37C8.77 40.2 15.8 45 24 45Z"
                fill="#34A853"
              />
              <path
                d="M12.28 28.07A12.97 12.97 0 0 1 11.63 24c0-1.41.23-2.78.65-4.07v-5.37H5.35A20.98 20.98 0 0 0 3 24c0 3.39.81 6.59 2.35 9.44l6.93-5.37Z"
                fill="#FBBC05"
              />
              <path
                d="M24 11.29c3.06 0 5.8 1.05 7.96 3.12l5.98-5.98C34.34 5.08 29.62 3 24 3c-8.2 0-15.23 4.8-18.65 11.56l6.93 5.37c1.65-4.96 6.27-8.64 11.72-8.64Z"
                fill="#EA4335"
              />
            </svg>
          </button>

          <button
            type="button"
            aria-label="Continue with email"
            className="text-black transition-transform hover:scale-[1.03] focus:outline-none"
          >
            <svg
              className="h-12 w-12"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <rect x="1.5" y="8" width="45" height="32" rx="5.5" fill="#8B2E1D" />
              <path
                d="m10 17 11.73 8.39a4 4 0 0 0 4.54 0L38 17"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <p className="text-center text-sm font-medium text-[#5F5F5F]">
          Don&apos;t have an account?{' '}
          <span className="font-semibold text-[#3E3E3E]">Sign Up</span>
        </p>
      </form>
    </div>
  );
}
