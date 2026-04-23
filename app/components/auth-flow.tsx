'use client';

import { useRouter } from 'next/navigation';
import {
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';

const authCardClassName =
  'w-full max-w-sm rounded-[2.5rem] bg-white px-7 py-8 shadow-[0_8px_30px_rgba(15,23,42,0.08)] sm:px-10 sm:py-10';
const inputClassName =
  'w-full rounded-2xl bg-gray-100 px-5 py-4 text-base font-medium text-[#232323] placeholder:text-[#767676] focus:outline-none';
const primaryButtonClassName =
  'w-full rounded-2xl bg-black py-4 text-base font-semibold text-white shadow-[0_8px_18px_rgba(0,0,0,0.16)] transition-transform active:scale-[0.99]';

function AuthPageShell({
  children,
  showLogo = true,
}: {
  children: ReactNode;
  showLogo?: boolean;
}) {
  return (
    <div
      className={`min-h-screen bg-white px-6 py-12 ${
        showLogo
          ? 'flex flex-col items-center justify-center'
          : 'flex items-center justify-center'
      }`}
    >
      {showLogo ? (
        <div className="mb-10 text-center">
          <h1 className="text-[3.5rem] leading-none font-extrabold tracking-[-0.06em] text-black">
            ZLon.
          </h1>
        </div>
      ) : null}
      {children}
    </div>
  );
}

function AuthDivider() {
  return (
    <div className="my-8 flex items-center">
      <div className="flex-grow border-t border-gray-200" />
      <span className="mx-4 text-xs font-medium tracking-[0.28em] text-gray-400">
        OR SIGN IN WITH
      </span>
      <div className="flex-grow border-t border-gray-200" />
    </div>
  );
}

function SocialButtons() {
  return (
    <div className="mb-8 flex justify-center gap-8">
      <button
        type="button"
        aria-label="Continue with Google"
        className="text-black transition-transform hover:scale-[1.03] focus:outline-none"
      >
        <svg
          className="h-12 w-12"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M44 24.55c0-1.48-.13-2.9-.39-4.27H24v8.09h11.21c-.48 2.59-1.94 4.79-4.14 6.27v5.21h6.71C41.7 36.2 44 30.89 44 24.55Z"
            fill="#4285F4"
          />
          <path
            d="M24 45c5.63 0 10.35-1.87 13.8-5.08l-6.71-5.21c-1.86 1.25-4.24 2-7.09 2-5.45 0-10.07-3.68-11.72-8.64H5.35v5.37C8.77 40.2 15.8 45 24 45Z"
            fill="#34A853"
          />
          <path
            d="M12.28 28.07A12.97 12.97 0 0 1 11.63 24c0-1.41.23-2.78.65-4.07v-5.37H5.35A20.98 20.98 0 0 0 3 24c0 3.39.81 6.59 2.35 9.44l6.93-5.37Z"
            fill="#FBBC05"
          />
          <path
            d="M24 11.29c3.06 0 5.8 1.05 7.96 3.12l5.98-5.98C34.34 5.08 29.62 3 24 3c-8.2 0-15.23 4.8-18.65 11.56l6.93 5.37c1.65-4.96 6.27-8.64 11.72-8.64Z"
            fill="#EA4335"
          />
        </svg>
      </button>

      <button
        type="button"
        aria-label="Continue with email"
        className="text-black transition-transform hover:scale-[1.03] focus:outline-none"
      >
        <svg
          className="h-12 w-12"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect x="1.5" y="8" width="45" height="32" rx="5.5" fill="#8B2E1D" />
          <path
            d="m10 17 11.73 8.39a4 4 0 0 0 4.54 0L38 17"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

function FooterPrompt({
  prefix,
  actionLabel,
  onAction,
}: {
  prefix: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <p className="text-center text-sm font-medium text-[#5F5F5F]">
      {prefix}{' '}
      <button
        type="button"
        onClick={onAction}
        className="font-semibold text-[#3E3E3E] transition-opacity hover:opacity-80"
      >
        {actionLabel}
      </button>
    </p>
  );
}

function PhoneNumberRow({
  phone,
  onPhoneChange,
}: {
  phone: string;
  onPhoneChange: (value: string) => void;
}) {
  return (
    <div className="mb-6 flex gap-3">
      <div className="flex w-20 items-center justify-center rounded-2xl bg-gray-100 py-4 text-base font-medium text-[#232323]">
        +91
      </div>
      <input
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        value={phone}
        onChange={(event) =>
          onPhoneChange(event.target.value.replace(/\D/g, '').slice(0, 10))
        }
        placeholder="Enter Number"
        className={`${inputClassName} flex-1`}
      />
    </div>
  );
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
        <path
          d="M8 10V7a4 4 0 1 1 8 0v3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <rect
          x="5"
          y="10"
          width="14"
          height="10"
          rx="2"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
      <span>Secure Verification</span>
    </div>
  );
}

export function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');

  const handleSendOtp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (phone.trim().length > 0) {
      router.push('/verify-otp');
    }
  };

  return (
    <AuthPageShell>
      <form onSubmit={handleSendOtp} className={authCardClassName}>
        <h2 className="mb-8 text-center text-[2.15rem] font-bold tracking-[-0.04em] text-[#1F1F1F]">
          Welcome Back
        </h2>

        <PhoneNumberRow phone={phone} onPhoneChange={setPhone} />

        <button type="submit" className={primaryButtonClassName}>
          Send OTP
        </button>

        <AuthDivider />
        <SocialButtons />
        <FooterPrompt
          prefix="Don't have an account?"
          actionLabel="Sign Up"
          onAction={() => router.push('/register')}
        />
      </form>
    </AuthPageShell>
  );
}

export function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleContinue = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (name.trim().length > 0 && phone.trim().length > 0) {
      router.push('/verify-otp');
    }
  };

  return (
    <AuthPageShell>
      <form onSubmit={handleContinue} className={authCardClassName}>
        <h2 className="mb-8 text-center text-3xl font-bold text-[#1F1F1F]">
          Create Account
        </h2>

        <input
          type="text"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Enter Full Name"
          className={`${inputClassName} mb-4`}
        />

        <PhoneNumberRow phone={phone} onPhoneChange={setPhone} />

        <button type="submit" className={primaryButtonClassName}>
          Continue
        </button>

        <AuthDivider />
        <SocialButtons />
        <FooterPrompt
          prefix="Already have an account?"
          actionLabel="Log In"
          onAction={() => router.push('/login')}
        />
      </form>
    </AuthPageShell>
  );
}

export function VerifyOtpScreen() {
  const router = useRouter();
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [secondsLeft, setSecondsLeft] = useState(24);

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

    if (nextDigit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pastedOtp = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 4);

    if (!pastedOtp) {
      return;
    }

    event.preventDefault();

    const nextOtp = ['', '', '', ''];
    pastedOtp.split('').forEach((digit, index) => {
      nextOtp[index] = digit;
    });
    setOtp(nextOtp);

    const nextFocusIndex = Math.min(pastedOtp.length, 3);
    inputRefs.current[nextFocusIndex]?.focus();
  };

  const handleVerify = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (otp.every(Boolean)) {
      router.push('/dashboard');
    }
  };

  const handleResend = () => {
    if (secondsLeft > 0) {
      return;
    }

    setOtp(['', '', '', '']);
    setSecondsLeft(24);
    inputRefs.current[0]?.focus();
  };

  return (
    <AuthPageShell showLogo={false}>
      <form onSubmit={handleVerify} className={`${authCardClassName} py-10`}>
        <h1 className="mb-3 text-center text-3xl font-bold text-[#1F1F1F]">
          Verify OTP
        </h1>
        <p className="mb-8 text-center text-sm text-gray-500">
          Enter the code sent to you
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
              className="h-14 w-14 rounded-2xl bg-gray-100 text-center text-xl font-semibold text-[#1F1F1F] focus:outline-none"
            />
          ))}
        </div>

        <button type="submit" className={primaryButtonClassName}>
          Verify
        </button>

        <p className="mt-6 text-center text-sm text-[#6B6B6B]">
          Did not receive code?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={secondsLeft > 0}
            className={`font-semibold underline-offset-4 ${
              secondsLeft > 0
                ? 'cursor-default text-[#3E3E3E]'
                : 'text-[#1F1F1F] hover:underline'
            }`}
          >
            Resend
          </button>{' '}
          in <span className="font-semibold text-[#1F1F1F]">{secondsLeft}s</span>
        </p>

        <SecureVerificationBadge />
      </form>
    </AuthPageShell>
  );
}
