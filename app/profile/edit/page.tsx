'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import { updateProfile } from '../actions';

export default function EditProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    dob: '',
    gender: '',
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        const supabase = createSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/');
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name, email, phone_number, dob, gender')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (profile) {
          setFormData({
            full_name: profile.full_name || '',
            email: profile.email || user.email || '',
            phone_number: profile.phone_number || '',
            dob: profile.dob || '',
            gender: profile.gender || '',
          });
        } else {
          setFormData(prev => ({
            ...prev,
            full_name: user.user_metadata?.full_name || '',
            email: user.email || '',
          }));
        }
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [router]);

  const handleBack = () => {
    router.back();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const result = await updateProfile(formData);
      if (result.ok) {
        router.push('/profile');
        router.refresh();
      } else {
        setError(result.message);
        alert('Failed to save profile');
      }
    } catch (err: any) {
      setError(err.message);
      alert('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-neutral-400" size={32} />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-white text-neutral-950 font-sans antialiased">
      {/* Top Header */}
      <header className="flex items-center px-4 safe-area-pt pb-4 border-b border-neutral-100">
        <button
          onClick={handleBack}
          type="button"
          className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="ml-2 text-xl font-bold tracking-tight">Edit Profile</h1>
      </header>

      {/* Form Fields */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="flex-1 flex flex-col min-h-0"
      >
        <main className="flex-1 overflow-y-auto px-6 py-8 space-y-6 max-w-2xl mx-auto w-full">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="full_name" className="text-sm font-semibold uppercase tracking-widest text-gray-700">
              Full Name
            </label>
            <input
              id="full_name"
              type="text"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Enter your name"
              required
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-black focus:ring-1 focus:ring-black text-base transition-all shadow-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-semibold uppercase tracking-widest text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-black focus:ring-1 focus:ring-black text-base transition-all shadow-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="phone_number" className="text-sm font-semibold uppercase tracking-widest text-gray-700">
              Phone
            </label>
            <input
              id="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="Enter your phone number"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-black focus:ring-1 focus:ring-black text-base transition-all shadow-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="dob" className="text-sm font-semibold uppercase tracking-widest text-gray-700">
              Date of Birth
            </label>
            <input
              id="dob"
              type="date"
              value={formData.dob}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-black focus:ring-1 focus:ring-black text-base transition-all shadow-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="gender" className="text-sm font-semibold uppercase tracking-widest text-gray-700">
              Gender
            </label>
            <div className="relative">
              <select
                id="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-black focus:ring-1 focus:ring-black text-base transition-all appearance-none cursor-pointer shadow-sm"
              >
                <option value="" disabled>Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </main>

        {/* Bottom Action Buttons */}
        <footer className="p-6 border-t border-neutral-100 bg-white">
          <div className="max-w-2xl mx-auto flex gap-4">
            <button
              onClick={() => router.push('/profile')}
              disabled={isSaving}
              type="button"
              className="flex-1 px-6 py-4 rounded-full bg-neutral-100 text-neutral-900 font-bold hover:bg-neutral-200 transition-colors disabled:opacity-50"
            >
              Discard
            </button>
            <button
              disabled={isSaving}
              type="submit"
              className="flex-1 px-6 py-4 rounded-full bg-black text-white font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving && <Loader2 className="animate-spin" size={18} />}
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}
