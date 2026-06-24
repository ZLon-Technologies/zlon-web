'use client';

import React, { Suspense, type FormEvent, useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Mail, ChevronDown } from 'lucide-react';

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

function OtpInput({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value;
    if (!/^\d*$/.test(val)) return;

    const newOtp = value.split('');
    newOtp[index] = val.slice(-1);
    const combined = newOtp.join('');
    onChange(combined);

    if (val && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;
    onChange(pastedData);
    inputs.current[pastedData.length - 1 || 0]?.focus();
  };

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  return (
    <div className="flex justify-between gap-2 mb-6" onPaste={handlePaste}>
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <input
          key={index}
          ref={(el) => { inputs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleInput(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className="w-12 h-14 text-center text-xl font-bold text-black bg-gray-100 rounded-xl border-2 border-transparent focus:border-black focus:bg-white transition-all outline-none"
        />
      ))}
    </div>
  );
}

function LandingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = getSafeRedirectPath(searchParams.get('next'), '/dashboard');
  
  // Required States for Firebase Phone Auth
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Additional UI states
  const [countryCode, setCountryCode] = useState('+91');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && auth && !window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA verified');
          },
        });
      } catch (err) {
        console.error('Failed to initialize RecaptchaVerifier:', err);
      }
    }

    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
      }
    };
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  async function handleSendOTP() {
    if (phoneNumber.length !== 10) {
      setErrorMessage('Enter a valid 10-digit phone number.');
      return;
    }

    if (!auth) {
      setErrorMessage('Authentication service is currently unavailable.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      const appVerifier = window.recaptchaVerifier;
      if (!appVerifier) throw new Error('reCAPTCHA verifier not ready');
      
      const result = await signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier);
      setConfirmationResult(result);
      setIsLoading(false);
      setTimeLeft(60);
    } catch (error) {
      console.error('Error sending OTP:', error);
      setIsLoading(false);
      
      const errorCode = (error as { code?: string }).code;
      switch (errorCode) {
        case 'auth/invalid-phone-number':
          setErrorMessage('The phone number is invalid.');
          break;
        case 'auth/too-many-requests':
          setErrorMessage('Too many attempts. Please try again later.');
          break;
        case 'auth/captcha-check-failed':
          setErrorMessage('Security verification failed. Please try again.');
          break;
        default:
          setErrorMessage('Failed to send OTP. Please try again.');
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
        // 1. Confirm OTP
        const result = await confirmationResult.confirm(otpCode);
        const user = result.user;

        // 2. Check if user is new via Firestore
        const profileRef = doc(db, 'users', user.uid);
        const profileSnap = await getDoc(profileRef);
        const isNewUser = !profileSnap.exists();

        if (isNewUser) {
          // Initialize user for new user
          await setDoc(profileRef, {
            uid: user.uid,
            phone: user.phoneNumber,
            createdAt: new Date().toISOString(),
          });
          router.push('/onboarding');
        } else {
          const searchParams = new URLSearchParams(window.location.search);
          const nextRoute = searchParams.get('next') || '/dashboard';
          router.push(nextRoute);
        }
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setIsLoading(false);
      
      const firebaseErrorMap: Record<string, string> = {
        'auth/invalid-verification-code': 'Invalid OTP code. Please check and try again.',
        'auth/code-expired': 'OTP code has expired. Please request a new one.',
      };

      const err = error as { code?: string; message?: string };
      setErrorMessage(firebaseErrorMap[err.code || ''] || err.message || 'Verification failed. Please try again.');
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

    try {
      if (!auth) throw new Error('Auth not initialized');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user is new via Firestore
      const profileRef = doc(db, 'users', user.uid);
      const profileSnap = await getDoc(profileRef);
      
      if (!profileSnap.exists()) {
        await setDoc(profileRef, {
          uid: user.uid,
          email: user.email,
          fullName: user.displayName,
          avatarUrl: user.photoURL,
          phone: user.phoneNumber || '',
          createdAt: new Date().toISOString(),
        });
        router.push('/onboarding');
      } else {
        router.push(nextPath);
      }
    } catch (error: any) {
      setIsGoogleLoading(false);
      setErrorMessage(error.message);
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen w-full bg-white">
      {/* reCAPTCHA Container - Absolute and invisible to prevent layout shift */}
      <div id="recaptcha-container" className="absolute pointer-events-none invisible"></div>

      {/* Left Column - Auth Area */}
      <div className="flex flex-col items-center justify-center px-5 py-12 bg-white pt-[var(--safe-top)] w-full relative z-10">
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

            {!confirmationResult ? (
              <div className="mb-6 bg-gray-100 rounded-xl flex items-center p-1 border border-transparent focus-within:border-black/5 transition-colors relative">
                <div className="relative flex items-center pl-3 pr-1 gap-1">
                  <span className="font-semibold text-black text-sm">{countryCode}</span>
                  <ChevronDown size={14} className="text-gray-500" />
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none"
                    aria-label="Select Country Code"
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
                />
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-center text-sm text-gray-500 mb-6 font-medium">
                  Enter the code sent to <span className="text-black font-bold">{countryCode} {phoneNumber}</span>
                </p>
                <OtpInput value={otpCode} onChange={(val) => {
                  setOtpCode(val);
                  if (errorMessage) setErrorMessage(null);
                }} />
                
                <div className="flex justify-center mb-6">
                  {timeLeft > 0 ? (
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Resend code in {formatTime(timeLeft)}
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      className="text-xs font-bold text-zinc-900 hover:underline transition-all uppercase tracking-widest"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full rounded-2xl bg-black py-4 font-semibold text-white transition-colors hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-70 shadow-lg shadow-black/10"
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
    recaptchaVerifier: RecaptchaVerifier | undefined;
    grecaptcha: unknown;
  }
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LandingPageContent />
    </Suspense>
  );
}
