'use client';

import { Suspense, useState, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';

function BackIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getSafeRedirectPath(pathname: string | null, fallback: string) {
  if (!pathname || !pathname.startsWith('/') || pathname.startsWith('//')) {
    return fallback;
  }

  return pathname;
}

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = getSafeRedirectPath(searchParams.get('next'), '/dashboard');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'form' | 'verify'>('form');

  async function handleSignup(event?: FormEvent<HTMLFormElement>) {
    if (event) event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Enter your email and a password to continue.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      if (!auth) throw new Error('Auth not initialized');
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await sendEmailVerification(userCredential.user);

      setIsSubmitting(false);
      setStep('verify');
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'An unexpected error occurred.');
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen w-full bg-white">
      {/* Left Column - Auth Area */}
      <div className="flex flex-col items-center justify-center px-5 py-12 bg-white pt-[var(--safe-top)] w-full relative z-10">
        <div className="w-full max-w-md mx-auto">
          {step === 'form' ? (
            <>
              <button
                type="button"
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm font-medium text-black transition-opacity hover:opacity-70 mb-10"
              >
                <BackIcon />
                <span>Back</span>
              </button>

              <div className="mb-10 text-center">
                <h1 className="text-4xl font-extrabold tracking-[-0.05em] text-black">Create Your Account</h1>
              </div>

              <form onSubmit={handleSignup} className="w-full">
                <div className="mb-6">
                  <label htmlFor="signup-email" className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-400">
                    Enter Email
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    autoComplete="email"
                    className="w-full rounded-2xl bg-gray-100 px-5 py-4 text-black placeholder-gray-400 focus:outline-none font-medium transition-colors border border-transparent focus:border-black/5"
                    placeholder="name@example.com"
                  />
                </div>

                <div className="mb-8">
                  <label htmlFor="signup-password" className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-400">
                    Set Password
                  </label>
                  <input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    autoComplete="new-password"
                    className="w-full rounded-2xl bg-gray-100 px-5 py-4 text-black placeholder-gray-400 focus:outline-none font-medium transition-colors border border-transparent focus:border-black/5"
                    placeholder="Min. 6 characters"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-black py-4 font-semibold text-white transition-all hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-70 shadow-lg shadow-black/10"
                >
                  <span>{isSubmitting ? 'Creating Account...' : 'Continue'}</span>
                  {!isSubmitting && <ArrowRightIcon />}
                </button>

                {errorMessage && (
                  <p className="mt-4 text-center text-xs font-bold text-red-500 uppercase tracking-tight animate-in fade-in zoom-in duration-200">
                    {errorMessage}
                  </p>
                )}

                <p className="mt-10 text-center text-sm text-gray-500 leading-relaxed max-w-[280px] mx-auto">
                  By continuing, you agree to receive curated updates from our sanctuary.
                </p>
              </form>

              <p className="mt-10 text-center text-sm text-gray-500 font-medium">
                Already a member?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/login-email')}
                  className="font-bold text-black hover:underline underline-offset-4 transition-all"
                >
                  Sign in here
                </button>
              </p>
            </>
          ) : (
            <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8 flex justify-center">
                <div className="rounded-full bg-green-50 p-6">
                  <Mail className="h-10 w-10 text-green-600" />
                </div>
              </div>
              
              <h1 className="text-4xl font-extrabold tracking-[-0.05em] text-black mb-4">Check Your Inbox</h1>
              <p className="text-lg text-gray-500 leading-relaxed mb-10 max-w-sm mx-auto font-medium">
                We&apos;ve sent a secure verification link to <span className="text-black font-bold">{email}</span>. 
                Click the link to activate your account and access your dashboard.
              </p>

              <div className="space-y-6">
                <button
                  onClick={() => handleSignup()}
                  disabled={isSubmitting}
                  className="text-xs font-bold text-zinc-900 hover:underline transition-all uppercase tracking-widest disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Resend Verification Email'}
                </button>

                <div className="pt-10">
                  <button
                    onClick={() => router.push('/login')}
                    className="text-xs font-bold text-gray-400 hover:text-black transition-all uppercase tracking-widest"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            </div>
          )}
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

function Mail(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupPageContent />
    </Suspense>
  );
}
