'use client';

import { useState, useEffect } from 'react';
import { createClient as createSupabaseBrowserClient } from '@/lib/supabase/client';
import { X, Mail, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function RegistrationGuard() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    async function checkProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_profile_complete, email')
        .eq('id', user.id)
        .maybeSingle();

      if (profile && profile.is_profile_complete === false) {
        setIsOpen(true);
      }
    }

    checkProfile();
  }, [supabase]);

  async function handleCompleteProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !userId) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          email: email.trim(), 
          is_profile_complete: true 
        })
        .eq('id', userId);

      if (error) throw error;

      setIsSuccess(true);
      setTimeout(() => setIsOpen(false), 2000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden"
          >
            {isSuccess ? (
              <div className="text-center py-6">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-black mb-2">Profile Updated</h2>
                <p className="text-gray-500">Welcome to the ZLon family.</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
                    <Mail className="w-6 h-6 text-amber-600" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-black mb-2">Complete Setup</h2>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Please enter your email address to receive booking confirmations and secure your account.
                  </p>
                </div>

                <form onSubmit={handleCompleteProfile} className="space-y-4">
                  <div>
                    <input
                      type="email"
                      required
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-2xl bg-gray-100 px-5 py-4 text-black placeholder-gray-400 focus:outline-none font-medium border border-transparent focus:border-black/5 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-2xl bg-black py-4 font-bold text-white transition-all hover:bg-neutral-900 disabled:opacity-50 shadow-lg shadow-black/10 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : 'Complete Account'}
                  </button>

                  {errorMessage && (
                    <p className="text-center text-xs font-bold text-red-500 uppercase tracking-tight">
                      {errorMessage}
                    </p>
                  )}
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
