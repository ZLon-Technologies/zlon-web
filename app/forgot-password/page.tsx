'use client';

import { Suspense, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Sparkles } from 'lucide-react';
import { createClient as createSupabaseBrowserClient } from '@/lib/supabase/client';

function ForgotPasswordContent() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      setStatus({ type: 'error', message: 'Enter your email address.' });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/change-password`,
    });

    setIsSubmitting(false);

    if (error) {
      setStatus({ type: 'error', message: error.message });
    } else {
      setStatus({ type: 'success', message: 'Password reset link sent to your email.' });
      setEmail('');
    }
  }

  return (
    <main className="flex min-h-screen w-full flex-col px-5 py-8">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-neutral-50"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-semibold tracking-tight text-neutral-950">Forgot Password</h1>
      </header>

      <div className="mt-12 flex flex-1 flex-col items-center">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-neutral-100 shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-neutral-900 shadow-sm">
            <Mail size={32} strokeWidth={2} />
          </div>
          <div className="absolute -right-1 -top-1 flex h-10 w-10 items-center justify-center rounded-full bg-black text-white shadow-lg">
            <Sparkles size={18} strokeWidth={2.2} />
          </div>
        </div>

        <div className="mt-8 text-center">
          <h2 className="text-2xl font-bold text-black">Reset Your Password</h2>
          <p className="mt-2 max-w-xs text-sm leading-6 text-gray-500">
            Enter your email and we&apos;ll send you a link to get back into your account.
          </p>
        </div>

        <form
          onSubmit={handleResetPassword}
          className="mt-10 w-full max-w-sm space-y-6 rounded-[2.5rem] bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-10"
        >
          <div>
            <label htmlFor="reset-email" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Email Address
            </label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. julian@example.com"
              className="w-full rounded-2xl bg-gray-100 py-4 px-5 text-black focus:outline-none"
            />
          </div>

          {status && (
            <div className={`rounded-xl p-3 text-center text-sm ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {status.message}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-black py-4 font-semibold text-white transition-colors hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
