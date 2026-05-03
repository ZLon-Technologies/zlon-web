'use client';

import { Suspense, useState, type FormEvent, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient as createSupabaseBrowserClient } from '@/lib/supabase/client';

function EnvelopeIcon() {
  return (
    <svg
      className="h-5 w-5 text-gray-500"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5.5 8L10.96 12.1a1.8 1.8 0 0 0 2.08 0L18.5 8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      className="h-5 w-5 text-gray-500"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M8 10V8a4 4 0 1 1 8 0v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="5" y="10" width="14" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function InputField({
  id,
  type,
  placeholder,
  icon,
  value,
  onChange,
}: {
  id: string;
  type: string;
  placeholder: string;
  icon: ReactNode;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2">{icon}</span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-2xl bg-gray-100 py-4 pr-5 pl-12 text-black placeholder:text-gray-500 focus:outline-none"
      />
    </div>
  );
}

function getSafeRedirectPath(pathname: string | null, fallback: string) {
  if (!pathname || !pathname.startsWith('/') || pathname.startsWith('//')) {
    return fallback;
  }

  return pathname;
}

function LoginEmailPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();
  const nextPath = getSafeRedirectPath(searchParams.get('next'), '/home');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleEmailLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      setErrorMessage('Enter your email address to receive a verification code.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.push(
      `/verify-otp?email=${encodeURIComponent(email.trim())}&next=${encodeURIComponent(nextPath)}`
    );
  }

  return (
    <main className="flex w-full items-center justify-center px-5 py-12">
      <div className="w-full max-w-md text-center">
        <h1 className="mb-10 text-4xl font-extrabold tracking-[-0.06em] text-black">ZLon.</h1>

        <form
          onSubmit={handleEmailLogin}
          className="rounded-[2.5rem] bg-white px-8 py-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:px-10"
        >
          <h2 className="mb-8 text-center text-3xl font-bold text-black">Welcome Back</h2>

          <div className="space-y-5">
            <InputField
              id="login-email"
              type="email"
              placeholder="Enter Email"
              icon={<EnvelopeIcon />}
              value={email}
              onChange={(value) => {
                setEmail(value);
                if (errorMessage) {
                  setErrorMessage('');
                }
              }}
            />
            <InputField
              id="login-password"
              type="password"
              placeholder="Enter Password"
              icon={<LockIcon />}
              value={password}
              onChange={setPassword}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-7 w-full rounded-2xl bg-black py-4 font-semibold text-white transition-colors hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Sending OTP...' : 'Continue'}
          </button>

          {errorMessage ? (
            <p className="mt-4 text-center text-sm text-red-500">{errorMessage}</p>
          ) : null}

          <div className="my-8 flex items-center">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="mx-4 text-xs font-medium tracking-[0.28em] text-gray-400">OR SIGN IN WITH</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <div className="space-y-2 text-center text-lg text-gray-600">
            <p>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => router.push('/signup')}
                className="font-semibold text-gray-800 transition-opacity hover:opacity-70"
              >
                Sign Up
              </button>
            </p>
            <button
              type="button"
              onClick={() => router.push('/forgot-password')}
              className="text-base font-medium text-gray-700 transition-opacity hover:opacity-70"
            >
              Forget Password
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default function LoginEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginEmailPageContent />
    </Suspense>
  );
}
