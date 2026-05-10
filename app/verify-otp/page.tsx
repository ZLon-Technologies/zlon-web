'use client';

import {
  type ClipboardEvent,
  type KeyboardEvent,
  Suspense,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient as createSupabaseBrowserClient } from '@/lib/supabase/client';

const OTP_LENGTH = 6;

function getSafeRedirectPath(pathname: string | null, fallback: string) {
  if (!pathname || !pathname.startsWith('/') || pathname.startsWith('//')) {
    return fallback;
  }

  return pathname;
}

function SecureVerificationBadge() {
  return (
    <div className="mt-10 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-gray-400">
      <svg
        className="h-4 w-4 flex-none"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
      </svg>
      <span>Secure Verification</span>
    </div>
  );
}

function VerifyOtpFallback() {
  return (
    <main className="flex w-full items-center justify-center px-5 py-12">
      <div className="w-full rounded-[2.5rem] bg-white px-8 py-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:px-10">
        <h1 className="mb-3 text-center text-3xl font-bold text-black">Verify OTP</h1>
        <p className="mb-8 text-center text-sm leading-6 text-gray-500">Loading verification details...</p>

        <div className="mb-8 flex justify-center gap-3">
          {Array.from({ length: OTP_LENGTH }).map((_, index) => (
            <div key={index} className="h-14 w-14 rounded-2xl bg-gray-100" />
          ))}
        </div>

        <div className="h-14 rounded-2xl bg-black" />
        <SecureVerificationBadge />
      </div>
    </main>
  );
}

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();
  const nextPath = getSafeRedirectPath(searchParams.get('next'), '/home');
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [otp, setOtp] = useState(() => Array.from({ length: OTP_LENGTH }, () => ''));
  const [secondsLeft, setSecondsLeft] = useState(24);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const isMountedRef = useRef(true);

  const queryEmail =
    searchParams.get('email') ??
    (searchParams.get('method') === 'email' ? searchParams.get('contact') : null);
  const queryPhone =
    searchParams.get('phone') ??
    (searchParams.get('method') === 'phone' ? searchParams.get('contact') : null);
  const querySessionId = searchParams.get('sessionId');

  const [currentSessionId, setCurrentSessionId] = useState(querySessionId);

  const verificationDetails = queryPhone
    ? {
        email: null,
        phone: queryPhone,
        contact: queryPhone,
        contactLabel: 'phone number',
      }
    : queryEmail
      ? {
          email: queryEmail,
          phone: null,
          contact: queryEmail,
          contactLabel: 'email address',
        }
      : {
          email: null,
          phone: null,
          contact: '',
          contactLabel: 'email address',
        };

  const hasAutoFocusedRef = useRef(false);

  useEffect(() => {
    if (!hasAutoFocusedRef.current) {
      hasAutoFocusedRef.current = true;
      inputRefs.current[0]?.focus();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (secondsLeft === 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSecondsLeft((currentValue) => Math.max(currentValue - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [secondsLeft]);

  const updateOtpDigit = (index: number, value: string) => {
    const nextDigit = value.replace(/\D/g, '').slice(-1);

    setOtp((currentOtp) => {
      const nextOtp = [...currentOtp];
      nextOtp[index] = nextDigit;
      return nextOtp;
    });

    if (errorMessage) {
      setErrorMessage('');
    }

    if (statusMessage) {
      setStatusMessage('');
    }

    if (nextDigit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pastedOtp = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, OTP_LENGTH);

    if (!pastedOtp) {
      return;
    }

    event.preventDefault();

    const nextOtp = Array.from({ length: OTP_LENGTH }, () => '');
    pastedOtp.split('').forEach((digit, index) => {
      nextOtp[index] = digit;
    });

    setOtp(nextOtp);
    setErrorMessage('');
    setStatusMessage('');

    const nextFocusIndex = Math.min(pastedOtp.length, OTP_LENGTH - 1);
    inputRefs.current[nextFocusIndex]?.focus();
  };

  const handleVerify = async () => {
    const token = otp.join('');

    if (!verificationDetails.contact) {
      setErrorMessage('The verification destination is missing. Please request a new OTP.');
      return;
    }

    if (token.length !== OTP_LENGTH) {
      setErrorMessage('Enter the full 6-digit verification code.');
      return;
    }

    if (verificationDetails.phone && !currentSessionId) {
      setErrorMessage('Session details are missing. Please request a new OTP.');
      return;
    }

    setErrorMessage('');
    setStatusMessage('');
    setIsVerifying(true);

    try {
      if (verificationDetails.phone) {
        // 1. Custom Server-side Verification for Phone (2Factor)
        const response = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: verificationDetails.phone,
            otp: token,
            sessionId: currentSessionId,
          }),
        });

        const data = await response.json();

        if (!isMountedRef.current) return;
        setIsVerifying(false);

        if (!response.ok) {
          setErrorMessage(data.error || 'Verification failed');
          return;
        }

        // Successfully verified and signed in via API (cookies set)
        router.replace(data.redirectTo || nextPath);
      } else {
        // 2. Native Supabase Verification for Email
        const response = await supabase.auth.verifyOtp({
          email: verificationDetails.email!,
          token,
          type: 'email',
        });

        if (!isMountedRef.current) return;
        setIsVerifying(false);

        if (response.error) {
          setErrorMessage(response.error.message);
          return;
        }

        const user = response.data.user ?? response.data.session?.user;
        const hasCompletedProfile = Boolean(
          user?.user_metadata?.full_name ||
            user?.user_metadata?.name ||
            user?.user_metadata?.first_name
        );

        router.replace(
          hasCompletedProfile
            ? nextPath
            : `/complete-profile?next=${encodeURIComponent(nextPath)}`
        );
      }
    } catch (err) {
      if (isMountedRef.current) {
        setIsVerifying(false);
        setErrorMessage('An unexpected error occurred during verification.');
      }
    }
  };

  const handleResend = async () => {
    if (secondsLeft > 0 || !verificationDetails.contact) {
      return;
    }

    setErrorMessage('');
    setStatusMessage('');
    setIsResending(true);

    try {
      if (verificationDetails.phone) {
        // Custom Send OTP for Phone
        const response = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: verificationDetails.phone }),
        });

        const data = await response.json();

        if (!isMountedRef.current) return;
        setIsResending(false);

        if (!response.ok) {
          setErrorMessage(data.error || 'Failed to resend OTP');
          return;
        }

        setCurrentSessionId(data.sessionId);
      } else {
        // Native Supabase Resend for Email
        const response = await supabase.auth.signInWithOtp({
          email: verificationDetails.email!,
        });

        if (!isMountedRef.current) return;
        setIsResending(false);

        if (response.error) {
          setErrorMessage(response.error.message);
          return;
        }
      }

      setOtp(Array.from({ length: OTP_LENGTH }, () => ''));
      setSecondsLeft(24);
      setStatusMessage(`A new verification code was sent to ${verificationDetails.contact}.`);
      inputRefs.current[0]?.focus();
    } catch (err) {
      if (isMountedRef.current) {
        setIsResending(false);
        setErrorMessage('An unexpected error occurred while resending.');
      }
    }
  };

  return (
    <main className="flex w-full items-center justify-center px-5 py-12">
      <div className="w-full rounded-[2.5rem] bg-white px-8 py-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:px-10">
        <h1 className="mb-3 text-center text-3xl font-bold text-black">Verify OTP</h1>
        <p className="mb-8 text-center text-sm leading-6 text-gray-500">
          We&apos;ve sent a 6-digit verification code to your registered {verificationDetails.contactLabel} at{' '}
          {verificationDetails.contact || 'your account'}
        </p>

        <div className="mb-8 flex justify-center gap-3">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                inputRefs.current[index] = element;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(event) => updateOtpDigit(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              onPaste={handlePaste}
              autoComplete="one-time-code"
              aria-label={`Digit ${index + 1} of OTP`}
              className="h-14 w-14 rounded-2xl bg-gray-100 text-center text-xl font-semibold text-black focus:outline-none"
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleVerify}
          disabled={isVerifying || isResending}
          className="w-full rounded-2xl bg-black py-4 font-semibold text-white transition-colors hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isVerifying ? 'Verifying...' : 'Verify'}
        </button>

        {errorMessage ? <p className="mt-4 text-center text-sm text-red-500">{errorMessage}</p> : null}
        {statusMessage ? <p className="mt-4 text-center text-sm text-green-600">{statusMessage}</p> : null}

        <p className="mt-6 text-center text-sm text-gray-600">
          Did not receive code?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={secondsLeft > 0 || isResending || isVerifying || !verificationDetails.contact}
            className={`font-semibold underline-offset-4 ${
              secondsLeft > 0 || isResending || isVerifying || !verificationDetails.contact
                ? 'cursor-default text-gray-700'
                : 'text-black hover:underline'
            }`}
          >
            {isResending ? 'Resending...' : 'Resend'}
          </button>{' '}
          in <span className="font-semibold text-black">{secondsLeft}s</span>
        </p>

        <SecureVerificationBadge />
      </div>
    </main>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<VerifyOtpFallback />}>
      <VerifyOtpContent />
    </Suspense>
  );
}
