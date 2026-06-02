'use client';

import { Suspense, useState, type FormEvent } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient as createSupabaseBrowserClient } from '@/lib/supabase/client';

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
  const supabase = createSupabaseBrowserClient();
  const nextPath = getSafeRedirectPath(searchParams.get('next'), '/home');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Enter your email and a password to continue.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      });

      setIsSubmitting(false);

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      alert('Account created! Please check your email for verification.');
      router.push('/login-email');
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage('An unexpected error occurred.');
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen w-full bg-white">
      {/* Left Column - Auth Area */}
      <div className="flex flex-col items-center justify-center px-5 py-8 bg-white pt-[max(env(safe-area-inset-top),48px)] w-full relative z-10">
        <div className="w-full max-w-md mx-auto">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-base font-medium text-black transition-opacity hover:opacity-70"
          >
            <BackIcon />
            <span>Back</span>
          </button>

          <div className="mt-6 text-center">
            <h1 className="text-4xl font-bold tracking-[-0.05em] text-black">We appreciate</h1>
            <p className="mx-auto mt-4 max-w-xs text-lg leading-8 text-gray-500">
              That You Respect Your Time By Choosing ZLon
            </p>
          </div>

          <form
            onSubmit={handleSignup}
            className="mt-8 rounded-[2.5rem] bg-white px-8 py-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:px-10"
          >
            <label htmlFor="signup-email" className="mb-2 block text-center text-lg font-bold text-black">
              Enter Email
            </label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (errorMessage) {
                  setErrorMessage('');
                }
              }}
              autoComplete="email"
              className="w-full rounded-2xl bg-gray-100 px-5 py-4 text-black focus:outline-none"
            />

            <label htmlFor="signup-password" className="mt-6 mb-2 block text-center text-lg font-bold text-black">
              Set Password
            </label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              className="w-full rounded-2xl bg-gray-100 px-5 py-4 text-black focus:outline-none"
            />

            <p className="my-6 max-w-[15rem] mx-auto text-sm leading-7 text-gray-400 text-center">
              By continuing, you agree to receive beautifully curated updates from our sanctuary. No clutter, just
              care.
            </p>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-black py-4 font-semibold text-white transition-colors hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span>{isSubmitting ? 'Creating Account...' : 'Continue'}</span>
              <ArrowRightIcon />
            </button>

            {errorMessage ? <p className="mt-4 text-center text-sm text-red-500">{errorMessage}</p> : null}
          </form>

          <p className="mt-6 text-center text-base text-gray-500">
            Already a member?{' '}
            <button
              type="button"
              onClick={() => router.push('/login-email')}
              className="font-semibold text-gray-800 underline-offset-4 transition-opacity hover:opacity-70 hover:underline"
            >
              Sign in here
            </button>
          </p>
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

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupPageContent />
    </Suspense>
  );
}
