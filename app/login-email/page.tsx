'use client';

import { Suspense, useState, type FormEvent, type ReactNode, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, query, collection, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { Lock, Mail } from 'lucide-react';

function InputField({
  id,
  type,
  placeholder,
  icon,
  value,
  onChange,
  disabled = false,
  className = "",
}: {
  id: string;
  type: string;
  placeholder: string;
  icon: ReactNode;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative mb-6 bg-gray-100 rounded-xl flex items-center p-1 border border-transparent focus-within:border-black/5 transition-colors ${className}`}>
      <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2">{icon}</span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        disabled={disabled}
        className="w-full bg-transparent py-4 pr-5 pl-12 text-black placeholder:text-gray-400 focus:outline-none font-medium"
      />
    </div>
  );
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

function getSafeRedirectPath(pathname: string | null, fallback: string) {
  if (!pathname || !pathname.startsWith('/') || pathname.startsWith('//')) {
    return fallback;
  }

  return pathname;
}

function LoginEmailPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = getSafeRedirectPath(searchParams.get('next'), '/dashboard');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password');
  const [otpSent, setOtpSent] = useState(false);
  
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer State
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  async function handleEmailLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || (loginMode === 'password' && !password.trim())) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      if (!auth) throw new Error('Auth not initialized');

      if (loginMode === 'password') {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;

        // Database Sync: Ensure profile exists and email is set
        const profileRef = doc(db, 'profiles', user.uid);
        const profileSnap = await getDoc(profileRef);

        if (!profileSnap.exists()) {
          // Check if a profile exists with this email but different ID (Firebase case)
          const q = query(collection(db, 'profiles'), where('email', '==', email.trim()));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const existingDoc = querySnapshot.docs[0];
            const data = existingDoc.data();
            // Update the existing profile or create a new one with the correct UID
            await setDoc(doc(db, 'profiles', user.uid), { ...data, id: user.uid, email: email.trim() });
            // Optionally delete the old one if the ID was different
            if (existingDoc.id !== user.uid) {
              await deleteDoc(existingDoc.ref);
            }
          } else {
            // Create a new profile
            await setDoc(doc(db, 'profiles', user.uid), { id: user.uid, email: email.trim() });
          }
        }

        // Dynamic redirect handler
        const nextRoute = searchParams.get('next') || '/dashboard';
        router.push(nextRoute);
      } else {
        // OTP Mode
        setErrorMessage('Email OTP is currently not supported. Please use password login.');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'An unexpected error occurred.');
    }
  }

  const toggleMode = () => {
    setLoginMode(loginMode === 'password' ? 'otp' : 'password');
    setOtpSent(false);
    setErrorMessage('');
    setOtpCode('');
    setTimeLeft(0);
  };

  const handleResendOtp = async () => {
    setErrorMessage('Email OTP is currently not supported.');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen w-full bg-white">
      {/* Left Column - Auth Area */}
      <div className="flex flex-col items-center justify-center px-5 py-12 bg-white pt-[max(env(safe-area-inset-top),48px)] w-full relative z-10">
        <div className="w-full max-w-md mx-auto">
          
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

          <div className="w-full">
            <h2 className="text-2xl font-bold mb-6 text-center text-black tracking-tight">Welcome Back</h2>

            <form onSubmit={handleEmailLogin} className="w-full">
              <InputField
                id="login-email"
                type="email"
                placeholder="Enter Email"
                icon={<Mail size={20} className="text-gray-500" />}
                value={email}
                disabled={otpSent}
                onChange={(value) => {
                  setEmail(value);
                  if (errorMessage) setErrorMessage('');
                }}
              />

              {loginMode === 'password' ? (
                <InputField
                  id="login-password"
                  type="password"
                  placeholder="Enter Password"
                  icon={<Lock size={20} className="text-gray-500" />}
                  value={password}
                  onChange={(value) => {
                    setPassword(value);
                    if (errorMessage) setErrorMessage('');
                  }}
                />
              ) : (
                otpSent && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-center text-sm text-gray-500 mb-6 font-medium">
                      Enter the code sent to <span className="text-black font-bold">{email}</span>
                    </p>
                    <OtpInput value={otpCode} onChange={(val) => {
                      setOtpCode(val);
                      if (errorMessage) setErrorMessage('');
                    }} />

                    <div className="flex justify-center mb-6">
                      {timeLeft > 0 ? (
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                          Resend code in {formatTime(timeLeft)}
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          className="text-xs font-bold text-zinc-900 hover:underline transition-all uppercase tracking-widest"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>
                  </div>
                )
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-black py-4 font-semibold text-white transition-colors hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-70 shadow-lg shadow-black/10"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {loginMode === 'otp' && !otpSent ? 'Sending...' : 'Verifying...'}
                  </span>
                ) : (
                  loginMode === 'password' 
                    ? 'Continue' 
                    : (otpSent ? 'Verify & Log In' : 'Send Login Code')
                )}
              </button>

              {errorMessage && (
                <p className="mt-4 text-center text-sm text-red-500 font-medium">{errorMessage}</p>
              )}

              <div className="mt-6 flex flex-col items-center space-y-4">
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-xs font-bold text-zinc-900 hover:underline transition-all uppercase tracking-widest"
                >
                  {loginMode === 'password' ? 'Sign in with OTP' : 'Sign in with Password'}
                </button>
                
                {loginMode === 'password' && (
                  <button
                    type="button"
                    onClick={() => router.push('/forgot-password')}
                    className="text-xs font-bold text-zinc-900 hover:underline transition-all uppercase tracking-widest"
                  >
                    Forget Password
                  </button>
                )}
              </div>
            </form>

            <div className="my-8 flex items-center">
              <div className="flex-grow border-t border-gray-100" />
              <span className="mx-4 text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">OR CONTINUE WITH</span>
              <div className="flex-grow border-t border-gray-100" />
            </div>

            <div className="space-y-3">
              <button
                type="button"
                className="w-full border border-gray-300 rounded-xl py-3.5 flex items-center justify-center gap-3 bg-white transition-all hover:bg-gray-50 active:scale-[0.99]"
                onClick={() => router.push('/login')}
              >
                <span className="text-sm font-semibold text-gray-700">Continue with Phone</span>
              </button>
            </div>

            <p className="mt-8 text-center text-sm text-gray-500">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => router.push('/signup')}
                className="font-bold text-black hover:underline"
              >
                Sign Up
              </button>
            </p>
          </div>
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

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginEmailPageContent />
    </Suspense>
  );
}
