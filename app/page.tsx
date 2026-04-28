'use client';

import React, { Suspense, type FormEvent, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient as createSupabaseBrowserClient } from '@/lib/supabase/client';

function getPhoneNumber(phone: string) {
  const digitsOnly = phone.replace(/\D/g, '').slice(0, 10);

  if (digitsOnly.length !== 10) {
    return null;
  }

  return `+91${digitsOnly}`;
}

function getSafeRedirectPath(pathname: string | null, fallback: string) {
  if (!pathname || !pathname.startsWith('/') || pathname.startsWith('//')) {
    return fallback;
  }

  return pathname;
}

function LandingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();
  const nextPath = getSafeRedirectPath(searchParams.get('next'), '/home');
  const [phone, setPhone] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);


  async function handlePhoneLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedPhone = getPhoneNumber(phone);

    if (!normalizedPhone) {
      setErrorMessage('Enter a valid 10-digit phone number.');
      return;
    }

    setErrorMessage('');
    setIsSendingOtp(true);

    const { error } = await supabase.auth.signInWithOtp({
      phone: normalizedPhone,
    });

    setIsSendingOtp(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.push(
      `/verify-otp?phone=${encodeURIComponent(normalizedPhone)}&next=${encodeURIComponent(nextPath)}`
    );
  }

  async function handleGoogleLogin(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    setErrorMessage('');
    setIsGoogleLoading(true);

    const callbackUrl = new URL('/auth/callback', window.location.origin);
    callbackUrl.searchParams.set('next', nextPath);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      setIsGoogleLoading(false);
      setErrorMessage(error.message);
      return;
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 py-12">
      <div className="mb-10">
        <Image
          src="/logo.png"
          alt="ZLon Logo"
          width={120}
          height={120}
          priority
          className="mx-auto object-contain"
        />
      </div>

      <form
        onSubmit={handlePhoneLogin}
        className="w-full max-w-sm rounded-[2.5rem] bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-10"
      >
        <h2 className="mb-8 text-center text-3xl font-bold text-black">Welcome Back</h2>

        <div className="mb-6 flex gap-3">
          <div className="flex w-20 items-center justify-center rounded-2xl bg-gray-100 py-4 font-medium text-black">
            +91
          </div>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value.replace(/\D/g, '').slice(0, 10));
              if (errorMessage) {
                setErrorMessage('');
              }
            }}
            placeholder="Enter Number"
            className="flex-1 rounded-2xl bg-gray-100 py-4 pl-5 text-black placeholder-gray-400 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSendingOtp || isGoogleLoading}
          className="w-full rounded-2xl bg-black py-4 font-semibold text-white transition-colors hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSendingOtp ? 'Sending OTP...' : 'Send OTP'}
        </button>

        {errorMessage ? (
          <p className="mt-4 text-center text-sm text-red-500">{errorMessage}</p>
        ) : null}

        <div className="my-8 flex items-center">
          <div className="flex-grow border-t border-gray-200" />
          <span className="mx-4 text-xs font-medium tracking-widest text-gray-400">OR SIGN IN WITH</span>
          <div className="flex-grow border-t border-gray-200" />
        </div>

        <div className="mb-8 flex justify-center gap-8">
          <button
            type="button"
            className="focus:outline-none"
            onClick={handleGoogleLogin}
            disabled={isSendingOtp || isGoogleLoading}
            aria-label="Continue with Google"
          >
            <svg
              className="h-10 w-10"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          </button>

          <button
            type="button"
            className="focus:outline-none"
            onClick={() => router.push('/login-email')}
            aria-label="Continue with email"
          >
            <svg
              className="h-10 w-10"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" fill="#7C2D12" />
              <path
                d="M2 7l10 6 10-6"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <p className="text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="cursor-pointer font-semibold text-gray-800 hover:underline">
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LandingPageContent />
    </Suspense>
  );
}
