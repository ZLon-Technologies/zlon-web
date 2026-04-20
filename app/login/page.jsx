'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

function ChevronDownIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-5 w-5 text-zinc-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 7.5 10 12.5l5-5" />
    </svg>
  );
}

function WhatsAppIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 32 32"
      className={className}
      fill="none"
    >
      <circle cx="16" cy="16" r="16" fill="#18181B" />
      <path
        d="M21.6 18.7c-.2-.1-1.3-.7-1.5-.7s-.4-.1-.5.2c-.2.3-.6.7-.7.9-.1.1-.3.2-.5.1a6.5 6.5 0 0 1-1.9-1.2 7.2 7.2 0 0 1-1.3-1.7c-.1-.2 0-.4.1-.5l.3-.4.2-.4c.1-.1 0-.3 0-.4l-.7-1.6c-.2-.3-.3-.3-.5-.3H14c-.1 0-.4 0-.6.3s-.8.8-.8 1.9.8 2.1 1 2.3c.1.2 1.6 2.5 4 3.4 2.4.9 2.4.6 2.8.6.4-.1 1.3-.5 1.5-1 .2-.5.2-.9.2-1s-.1-.1-.3-.2Z"
        fill="#fff"
      />
      <path
        d="M16 8.8a7.2 7.2 0 0 0-6.2 10.8l-.8 3.6 3.7-.8a7.2 7.2 0 1 0 3.3-13.6Zm0 12.9c-1.1 0-2.2-.3-3.1-.9l-.2-.1-2.2.5.5-2.1-.1-.2a5.7 5.7 0 1 1 5.1 2.8Z"
        fill="#fff"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-12 w-12">
      <path
        fill="#FFC107"
        d="M43.6 20H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-4Z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7 12.9 19.5C14.7 15.1 19 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.1 29.4 4 24 4c-7.7 0-14.3 4.3-17.7 10.7Z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.5-5.3l-6.2-5.2C29.2 35.4 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.6 5.1C9.4 39.6 16.1 44 24 44Z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20H42V20H24v8h11.3c-1 2.9-3 5.2-5.8 6.5l6.2 5.2C39 36.7 44 31 44 24c0-1.3-.1-2.7-.4-4Z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 64 78" className="h-14 w-14 fill-zinc-900">
      <path d="M53.2 41.5c0-8.2 6.7-12.1 7-12.3-3.8-5.6-9.7-6.3-11.8-6.4-5-.5-9.8 2.9-12.3 2.9s-6.4-2.8-10.5-2.7c-5.4.1-10.4 3.2-13.2 8-5.6 9.7-1.4 24 4 31.7 2.6 3.8 5.8 8 10 7.9 4-.2 5.5-2.6 10.3-2.6s6.1 2.6 10.4 2.5c4.3-.1 7-3.9 9.6-7.8 3-4.4 4.3-8.7 4.4-8.9-.1 0-8-3.1-8-12.3Z" />
      <path d="M45.2 13.3c2.1-2.6 3.5-6.2 3.1-9.8-3 .1-6.7 2-8.8 4.6-1.9 2.2-3.6 5.8-3.1 9.3 3.4.3 6.8-1.7 8.8-4.1Z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');

  function handleContinue() {
    console.log('Phone number:', phoneNumber);
    router.push('/verify-otp');
  }

  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-white px-5 py-10 text-zinc-900 sm:px-6">
      <div className="flex w-full max-w-[23.5rem] flex-col items-center gap-8">
        <div className="select-none text-[3.75rem] font-black leading-none tracking-[-0.09em] text-zinc-900">
          ZLon.
        </div>

        <section className="w-full rounded-[2rem] bg-white px-7 py-9 shadow-[0_24px_60px_rgba(24,24,27,0.10)] sm:px-8">
          <h1 className="text-center text-[2.7rem] font-bold leading-none tracking-[-0.05em] text-zinc-900">
            Welcome Back
          </h1>

          <div className="mt-14">
            <label
              htmlFor="phone-number"
              className="mb-3 block text-[1.1rem] font-medium text-zinc-700"
            >
              Phone Number
            </label>

            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Select country code"
                className="flex h-14 w-[4.75rem] items-center justify-between rounded-2xl bg-zinc-100 px-4 text-xl font-semibold text-zinc-900"
              >
                <span>+1</span>
                <ChevronDownIcon />
              </button>

              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                  <WhatsAppIcon className="h-6 w-6" />
                </span>

                <input
                  id="phone-number"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="000 000 0000"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  className="h-14 w-full rounded-2xl bg-zinc-100 pl-12 pr-4 text-[1.1rem] font-medium text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleContinue}
              className="mt-7 h-14 w-full rounded-2xl bg-zinc-900 text-lg font-semibold text-white shadow-[0_10px_18px_rgba(24,24,27,0.16)] transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99]"
            >
              Send OTP
            </button>
          </div>

          <div className="mt-10 flex items-center gap-4">
            <div className="h-px flex-1 bg-zinc-300" />
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-zinc-400">
              Or Sign In With
            </p>
            <div className="h-px flex-1 bg-zinc-300" />
          </div>

          <div className="mt-8 flex items-center justify-center gap-14">
            <button
              type="button"
              aria-label="Continue with Google"
              className="rounded-2xl p-2 transition-transform duration-150 hover:scale-105"
            >
              <GoogleIcon />
            </button>

            <button
              type="button"
              aria-label="Continue with Apple"
              className="rounded-2xl p-2 transition-transform duration-150 hover:scale-105"
            >
              <AppleIcon />
            </button>
          </div>

          <p className="mt-9 text-center text-[1.1rem] font-medium text-zinc-500">
            Don&apos;t have an account?{' '}
            <span className="font-semibold text-zinc-700">Sign Up</span>
          </p>
        </section>
      </div>
    </main>
  );
}
