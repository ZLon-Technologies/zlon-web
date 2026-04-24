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

const OTP_LENGTH = 6;

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
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-md rounded-[2.5rem] bg-white px-8 py-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:px-10">
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
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [otp, setOtp] = useState(() => Array.from({ length: OTP_LENGTH }, () => ''));
  const [secondsLeft, setSecondsLeft] = useState(24);

  const method = searchParams.get('method') === 'phone' ? 'phone' : 'email';
  const contact = searchParams.get('contact') ?? (method === 'phone' ? '+91 98765 43210' : 'user@example.com');
  const contactLabel = method === 'phone' ? 'phone number' : 'email address';

  useEffect(() => {
    inputRefs.current[0]?.focus();
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

    const nextFocusIndex = Math.min(pastedOtp.length, OTP_LENGTH - 1);
    inputRefs.current[nextFocusIndex]?.focus();
  };

  const handleVerify = () => {
    if (otp.every(Boolean)) {
      router.push('/dashboard');
    }
  };

  const handleResend = () => {
    if (secondsLeft > 0) {
      return;
    }

    setOtp(Array.from({ length: OTP_LENGTH }, () => ''));
    setSecondsLeft(24);
    inputRefs.current[0]?.focus();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-md rounded-[2.5rem] bg-white px-8 py-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:px-10">
        <h1 className="mb-3 text-center text-3xl font-bold text-black">Verify OTP</h1>
        <p className="mb-8 text-center text-sm leading-6 text-gray-500">
          We&apos;ve sent a 6-digit verification code to your registered {contactLabel} at {contact}
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
              className="h-14 w-14 rounded-2xl bg-gray-100 text-center text-xl font-semibold text-black focus:outline-none"
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleVerify}
          className="w-full rounded-2xl bg-black py-4 font-semibold text-white transition-colors hover:bg-neutral-900"
        >
          Verify
        </button>

        <p className="mt-6 text-center text-sm text-gray-600">
          Did not receive code?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={secondsLeft > 0}
            className={`font-semibold underline-offset-4 ${
              secondsLeft > 0 ? 'cursor-default text-gray-700' : 'text-black hover:underline'
            }`}
          >
            Resend
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
