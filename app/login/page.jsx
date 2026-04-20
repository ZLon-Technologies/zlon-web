'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

function WhatsAppIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
    >
      <path
        d="M12 2.25a9.7 9.7 0 0 0-8.39 14.55L2.25 21.75l5.12-1.32A9.75 9.75 0 1 0 12 2.25Z"
        fill="#25D366"
      />
      <path
        d="M9.53 7.31a1.04 1.04 0 0 0-.74.34c-.33.36-1.24 1.21-1.24 2.95 0 1.73 1.27 3.42 1.45 3.66.17.23 2.45 3.95 6.02 5.37 2.96 1.16 3.57.93 4.21.87.65-.06 2.07-.84 2.36-1.66.3-.81.3-1.5.21-1.65-.09-.14-.33-.23-.69-.41-.36-.18-2.08-1.03-2.41-1.15-.33-.12-.57-.18-.8.18-.24.36-.92 1.15-1.14 1.38-.21.24-.42.27-.78.09-.36-.18-1.52-.56-2.89-1.78-1.07-.95-1.79-2.13-2-2.49-.21-.36-.02-.55.16-.73.16-.16.36-.42.53-.63.18-.21.24-.36.36-.6.12-.24.06-.45-.03-.63-.09-.18-.8-1.95-1.09-2.67-.27-.65-.54-.56-.74-.57h-.63Z"
        fill="white"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');

  function handleContinue(event) {
    event.preventDefault();
    console.log('Phone number:', phoneNumber);
    router.push('/verify-otp');
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white sm:bg-zinc-100">
      <div className="w-full max-w-md h-screen sm:h-auto sm:min-h-[750px] bg-white sm:rounded-[40px] sm:shadow-2xl flex flex-col p-6 sm:p-8 relative">
        <div className="pointer-events-none absolute inset-[12px] hidden rounded-[32px] border border-zinc-100 sm:block" />
        <div className="pointer-events-none absolute left-1/2 top-3 h-1.5 w-24 -translate-x-1/2 rounded-full bg-zinc-200 sm:top-4" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-52 bg-[radial-gradient(circle_at_top,_rgba(244,244,245,0.95),_transparent_72%)] sm:rounded-t-[40px]" />

        <div className="relative flex h-full flex-col">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-zinc-400">
                ZLon
              </p>
              <p className="mt-2 text-sm font-medium text-zinc-500">
                Consumer App
              </p>
            </div>

            <div className="rounded-full border border-zinc-200 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
              Login
            </div>
          </div>

          <div className="mt-14 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-zinc-900 shadow-[0_20px_45px_rgba(24,24,27,0.18)]">
              <WhatsAppIcon className="h-10 w-10" />
            </div>
          </div>

          <div className="mt-12">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-400">
              Sign In
            </p>
            <h1 className="mt-4 text-[3rem] font-semibold leading-[0.95] tracking-[-0.08em] text-zinc-900">
              Welcome
              <br />
              back.
            </h1>
            <p className="mt-5 max-w-[18rem] text-[15px] leading-6 text-zinc-500">
              Enter your WhatsApp number and we&apos;ll send a one-time code to
              verify it.
            </p>
          </div>

          <form onSubmit={handleContinue} className="mt-10 flex flex-1 flex-col">
            <div className="rounded-[28px] border border-zinc-100 bg-zinc-50/80 p-5 backdrop-blur-sm">
              <label
                htmlFor="phone-number"
                className="mb-3 block text-sm font-semibold text-zinc-700"
              >
                Phone number
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                  <WhatsAppIcon className="h-5 w-5" />
                </span>

                <input
                  id="phone-number"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  className="h-14 w-full rounded-xl border border-zinc-200 bg-white pl-12 pr-4 text-base font-medium text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5"
                />
              </div>

              <p className="mt-3 text-sm leading-6 text-zinc-500">
                We&apos;ll only use this number for secure sign in and order
                updates.
              </p>
            </div>

            <div className="mt-auto pt-8">
              <button
                type="submit"
                className="h-14 w-full rounded-xl bg-zinc-900 text-base font-semibold text-white shadow-[0_14px_32px_rgba(24,24,27,0.18)] transition hover:bg-black active:scale-[0.99]"
              >
                Continue
              </button>

              <p className="mt-6 text-center text-sm leading-6 text-zinc-500">
                New to ZLon?{' '}
                <span className="font-semibold text-zinc-900">
                  Create an account
                </span>
              </p>

              <p className="mt-4 text-center text-xs leading-5 text-zinc-400">
                By continuing, you agree to our Terms and Privacy Policy.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
