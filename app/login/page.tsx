'use client';

import React, { Suspense, type FormEvent, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient as createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Mail, ChevronDown } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';

const COUNTRY_CODES = [
  { code: '+91', name: 'IN' },
  { code: '+1', name: 'US' },
  { code: '+44', name: 'UK' },
  { code: '+61', name: 'AU' },
];

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
  const nextPath = getSafeRedirectPath(searchParams.get('next'), '/dashboard');
  
  // Required States
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Additional UI states
  const [countryCode, setCountryCode] = useState('+91');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA verified');
        },
      });
    }
  }, []);

  async function handleSendOTP() {
    if (phoneNumber.length !== 10) {
      setErrorMessage('Enter a valid 10-digit phone number.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier);
      setConfirmationResult(result);
      setIsLoading(false);
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      setIsLoading(false);
      
      switch (error.code) {
        case 'auth/invalid-phone-number':
          setErrorMessage('The phone number is invalid.');
          break;
        case 'auth/too-many-requests':
          setErrorMessage('Too many attempts. Please try again later.');
          break;
        case 'auth/captcha-check-failed':
          setErrorMessage('reCAPTCHA verification failed. Please refresh and try again.');
          break;
        default:
          setErrorMessage('Failed to send OTP. Please try again.');
      }
      
      // Reset reCAPTCHA on failure
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.render().then((widgetId) => {
          window.grecaptcha.reset(widgetId);
        });
      }
    }
  }

  async function handleVerifyOTP() {
    if (otpCode.length !== 6) {
      setErrorMessage('Enter a valid 6-digit OTP.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (confirmationResult) {
        const result = await confirmationResult.confirm(otpCode);
        const user = result.user;
        
        // Link with Supabase or just redirect
        // For now, following directive to redirect to /dashboard
        router.push(nextPath);
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      setIsLoading(false);
      
      switch (error.code) {
        case 'auth/invalid-verification-code':
          setErrorMessage('Invalid OTP code. Please check and try again.');
          break;
        case 'auth/code-expired':
          setErrorMessage('OTP code has expired. Please request a new one.');
          break;
        default:
          setErrorMessage('Verification failed. Please try again.');
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!confirmationResult) {
      await handleSendOTP();
    } else {
      await handleVerifyOTP();
    }
  }

  async function handleGoogleLogin(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsGoogleLoading(true);

    const callbackUrl = new URL('https://zlon.in/api/auth-callback/callback');
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

    window.setTimeout(() => {
      setIsGoogleLoading(false);
    }, 5000);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen w-full bg-white">
      {/* reCAPTCHA Container */}
      <div id="recaptcha-container" className="absolute"></div>

      {/* Left Column - Auth Area */}
      <div className="flex flex-col items-center justify-center px-5 py-12 bg-white pt-[max(env(safe-area-inset-top),48px)] w-full relative z-10">
        <div className="w-full max-w-md mx-auto">
          <h1 className="sr-only">
            ZLon — Premium Salon & Grooming Booking Platform
          </h1>
          <p className="sr-only">
            Discover and book top-rated salons across India. From haircuts and spa treatments to full grooming sessions, ZLon lets you browse real-time availability, compare prices, and pay seamlessly with the built-in wallet — all in one app.
          </p>

          <div className="mb-10 bg-transparent">
            <Image
              src="/logo.png"
              alt="ZLon Logo"
              width={100}
              height={100}
              priority
              className="mx-auto object-contain"
            />
          </div>

          <form
            onSubmit={handleSubmit}
            className="w-full"
          >
            <h2 className="text-2xl font-bold mb-6 text-center text-black tracking-tight">Welcome Back</h2>

            <div className="mb-6 bg-gray-100 rounded-xl flex items-center p-1 border border-transparent focus-within:border-black/5 transition-colors relative">
              <div className="relative flex items-center pl-3 pr-1 gap-1">
                <span className="font-semibold text-black text-sm">{countryCode}</span>
                <ChevronDown size={14} className="text-gray-500" />
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none"
                  aria-label="Select Country Code"
                  disabled={!!confirmationResult}
                >
                  {COUNTRY_CODES.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.name} ({item.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-px h-6 bg-gray-300 mx-2" />
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                value={phoneNumber}
                onChange={(event) => {
                  setPhoneNumber(event.target.value.replace(/\D/g, '').slice(0, 10));
                  if (errorMessage) {
                    setErrorMessage(null);
                  }
                }}
                placeholder="Enter Number"
                className="flex-1 bg-transparent py-4 pr-4 text-black placeholder-gray-400 focus:outline-none font-medium"
                disabled={!!confirmationResult}
              />
            </div>

            {confirmationResult && (
              <div className="mb-6 bg-gray-100 rounded-xl flex items-center p-1 border border-transparent focus-within:border-black/5 transition-colors animate-in fade-in slide-in-from-top-2 duration-300">
                <input
                  type="text"
                  inputMode="numeric"
                  value={otpCode}
                  onChange={(event) => {
                    setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6));
                    if (errorMessage) {
                      setErrorMessage(null);
                    }
                  }}
                  placeholder="Enter 6-digit OTP"
                  className="flex-1 bg-transparent py-4 px-4 text-black placeholder-gray-400 focus:outline-none font-medium text-center tracking-[0.5em]"
                  maxLength={6}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full rounded-2xl bg-black py-4 font-semibold text-white transition-colors hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-70 shadow-lg shadow-black/10"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {confirmationResult ? 'Verifying...' : 'Sending...'}
                </span>
              ) : (
                confirmationResult ? 'Verify & Log In' : 'Send OTP'
              )}
            </button>

            {errorMessage ? (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl animate-in fade-in zoom-in duration-200">
                <p className="text-center text-sm text-red-500 font-medium">{errorMessage}</p>
              </div>
            ) : null}

            <div className="my-8 flex items-center">
              <div className="flex-grow border-t border-gray-100" />
              <span className="mx-4 text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">OR CONTINUE WITH</span>
              <div className="flex-grow border-t border-gray-100" />
            </div>

            <div className="space-y-3">
              <button
                type="button"
                className="w-full border border-gray-300 rounded-xl py-3.5 flex items-center justify-center gap-3 bg-white transition-all hover:bg-gray-50 active:scale-[0.99] disabled:opacity-50"
                onClick={handleGoogleLogin}
                disabled={isLoading || isGoogleLoading}
              >
                <svg
                  className="h-5 w-5"
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
                <span className="text-sm font-semibold text-gray-700">Continue with Google</span>
              </button>

              <button
                type="button"
                className="w-full border border-gray-300 rounded-xl py-3.5 flex items-center justify-center gap-3 bg-white transition-all hover:bg-gray-50 active:scale-[0.99]"
                onClick={() => router.push('/login-email')}
              >
                <Mail size={20} className="text-gray-700" />
                <span className="text-sm font-semibold text-gray-700">Continue with Email</span>
              </button>
            </div>

            <p className="mt-8 text-center text-sm text-gray-500">
              Don&apos;t have an account?{' '}
              <Link prefetch={false} href="/signup" className="cursor-pointer font-bold text-black hover:underline">
                Sign Up
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* Right Column - Brand Area (Desktop Only) */}
      <div className="hidden lg:flex lg:flex-col lg:justify-center lg:items-center bg-zinc-950 relative overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1974&auto=format&fit=crop"
          alt="Premium Grooming Experience"
          fill
          className="object-cover opacity-60"
          priority
        />
        <div className="relative z-10 text-center px-12">
          <h2 className="text-4xl font-bold text-white tracking-tight">Elevate your grooming experience.</h2>
          <p className="mt-4 text-lg text-zinc-300 font-medium max-w-md mx-auto">Book real-time haircuts, spa sessions, and premium treatments at India&apos;s finest salons.</p>
        </div>
      </div>
    </div>
  );
}

// Global declaration for reCAPTCHA
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
    grecaptcha: any;
  }
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LandingPageContent />
    </Suspense>
  );
}
