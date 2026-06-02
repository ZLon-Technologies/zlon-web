'use client';

import { Suspense, useState, type FormEvent, type ReactNode } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient as createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Lock, Mail, ChevronRight } from 'lucide-react';

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
  const nextPath = getSafeRedirectPath(searchParams.get('next'), '/dashboard');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password');
  const [otpSent, setOtpSent] = useState(false);
  
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleEmailLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || (loginMode === 'password' && !password.trim())) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      let authResult;
      if (loginMode === 'password') {
        authResult = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });
      } else {
        // OTP Mode
        if (!otpSent) {
          // Step 1: Send OTP
          const { error } = await supabase.auth.signInWithOtp({
            email: email.trim(),
            options: {
              shouldCreateUser: false,
            }
          });

          if (error) {
            setErrorMessage(error.message);
            setIsSubmitting(false);
            return;
          }

          setOtpSent(true);
          setIsSubmitting(false);
          return;
        } else {
          // Step 2: Verify OTP
          if (otpCode.length !== 6) {
            setErrorMessage('Enter a valid 6-digit verification code.');
            setIsSubmitting(false);
            return;
          }

          authResult = await supabase.auth.verifyOtp({
            email: email.trim(),
            token: otpCode,
            type: 'email',
          });
        }
      }

      if (authResult?.error) {
        setErrorMessage(authResult.error.message);
        setIsSubmitting(false);
        return;
      }

      if (authResult?.data.session) {
        // Database Sync: Ensure profile exists and email is set
        const user = authResult.data.user;
        
        if (!user) {
          setIsSubmitting(false);
          throw new Error("User session could not be established.");
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (!profile) {
          // Check if a profile exists with this email but different ID (Firebase case)
          const { data: emailProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email.trim())
            .maybeSingle();

          if (emailProfile) {
            // Update the existing profile to use the Supabase ID
            await supabase
              .from('profiles')
              .update({ id: user.id })
              .eq('email', email.trim());
          } else {
            // Create a new profile
            await supabase
              .from('profiles')
              .insert({ id: user.id, email: email.trim() });
          }
        }

        router.push(nextPath);
      }
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage('An unexpected error occurred.');
    }
  }

  const toggleMode = () => {
    setLoginMode(loginMode === 'password' ? 'otp' : 'password');
    setOtpSent(false);
    setErrorMessage('');
    setOtpCode('');
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
                  <InputField
                    id="login-otp"
                    type="text"
                    placeholder="Enter 6-digit Code"
                    icon={<Lock size={20} className="text-gray-500" />}
                    value={otpCode}
                    className="animate-in fade-in slide-in-from-top-2 duration-300"
                    onChange={(value) => {
                      setOtpCode(value.replace(/\D/g, '').slice(0, 6));
                      if (errorMessage) setErrorMessage('');
                    }}
                  />
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
