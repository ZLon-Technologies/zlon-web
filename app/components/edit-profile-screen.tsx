'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  ChevronRight,
  History,
  LogOut,
  Mail,
  Pencil,
  Phone,
  Shield,
  UserRound,
  Wallet,
  Settings,
  CreditCard,
  User,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { createClient as createSupabaseBrowserClient } from '@/lib/supabase/client';
import { MobileBottomNav } from './mobile-bottom-nav';
import { useBooking } from '../lib/booking-state';
import { formatCurrency } from '../lib/booking-flow';
import packageJson from '@/package.json';

interface ProfileState {
  id: string;
  fullName: string;
  emailAddress: string;
  phoneNumber: string;
  gender: string;
  avatarUrl: string;
  walletBalance: number;
  monthlyBookings: number;
}

interface ProfileRecord {
  id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  gender: string | null;
  avatar_url: string | null;
  wallet_balance: number;
  monthly_bookings: number;
}

interface EditProfileScreenProps {
  initialProfile: ProfileRecord | null;
}

type EditableField = 'fullName' | 'phoneNumber' | 'gender';

const surfaceClass =
  'rounded-[2rem] border border-black/5 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]';

const editableFieldLabels: Record<EditableField, string> = {
  fullName: 'Full Name',
  phoneNumber: 'Phone Number',
  gender: 'Gender',
};

const editableProfileColumns: Record<EditableField, 'full_name' | 'phone_number' | 'gender'> = {
  fullName: 'full_name',
  phoneNumber: 'phone_number',
  gender: 'gender',
};

function normalizeProfile(profile: ProfileRecord | null): ProfileState {
  return {
    id: profile?.id ?? '',
    fullName: profile?.full_name ?? '',
    emailAddress: profile?.email ?? '',
    phoneNumber: profile?.phone_number ?? '',
    gender: profile?.gender ?? '',
    avatarUrl: profile?.avatar_url ?? '',
    walletBalance: profile?.wallet_balance ?? 0,
    monthlyBookings: profile?.monthly_bookings ?? 0,
  };
}

function getDisplayValue(value: string) {
  return value.trim() || 'Not set';
}

function getAvatarFilePath(userId: string, file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safeExtension = extension.replace(/[^a-z0-9]/g, '') || 'jpg';

  return `${userId}/${Date.now()}.${safeExtension}`;
}

export function EditProfileScreen({ initialProfile }: EditProfileScreenProps) {
  const router = useRouter();
  const { clearState } = useBooking();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<ProfileState>(() => normalizeProfile(initialProfile));
  const [activeField, setActiveField] = useState<EditableField | null>(null);
  const [draftValue, setDraftValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const aiScansAvailable = Math.max(0, 3 - profile.monthlyBookings);

  const currentFieldValue = activeField ? profile[activeField as keyof ProfileState] as string : '';
  const hasDraftChanges = activeField !== null && draftValue !== currentFieldValue;

  function openFieldEditor(field: EditableField) {
    setActiveField(field);
    setDraftValue(profile[field as keyof ProfileState] as string);
    setMessage(null);
  }

  function closeFieldEditor() {
    setActiveField(null);
    setDraftValue('');
    setIsSaving(false);
  }

  async function saveField() {
    if (!activeField || !hasDraftChanges || !profile.id || isSaving) {
      return;
    }

    setIsSaving(true);
    setMessage(null);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from('profiles')
      .update({ [editableProfileColumns[activeField]]: draftValue })
      .eq('id', profile.id);

    if (error) {
      setMessage(error.message);
      setIsSaving(false);
      return;
    }

    setProfile((previousProfile) => ({
      ...previousProfile,
      [activeField]: draftValue,
    }));
    closeFieldEditor();
    router.refresh();
  }

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !profile.id) {
      return;
    }

    setIsSaving(true);
    setMessage(null);

    const supabase = createSupabaseBrowserClient();
    const filePath = getAvatarFilePath(profile.id, file);
    const uploadResult = await supabase.storage.from('avatars').upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

    if (uploadResult.error) {
      setMessage(uploadResult.error.message);
      setIsSaving(false);
      event.target.value = '';
      return;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const avatarUrl = data.publicUrl;
    const updateResult = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', profile.id);

    if (updateResult.error) {
      setMessage(updateResult.error.message);
      setIsSaving(false);
      event.target.value = '';
      return;
    }

    setProfile((previousProfile) => ({
      ...previousProfile,
      avatarUrl,
    }));
    setIsSaving(false);
    event.target.value = '';
    router.refresh();
  }

  async function handleLogOut() {
    setIsSaving(true);
    setMessage(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        setMessage(error.message);
        setIsSaving(false);
        return;
      }

      clearState();
      router.replace('/');
    } catch {
      setMessage('An unexpected error occurred during logout.');
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col bg-[#F9F9F9] min-h-screen text-neutral-950">
      <div className="bg-neutral-950 rounded-b-[3rem] shadow-lg pb-8">
        <header className="relative z-10 flex items-center justify-between px-6 pb-4 pt-[max(env(safe-area-inset-top),48px)]">
          <h1 className="text-white text-xl font-bold tracking-tight">Profile</h1>
          <button
            type="button"
            aria-label="Notifications"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
          >
            <Bell size={20} strokeWidth={2.1} />
          </button>
        </header>

        {/* Identity Section */}
        <section className="relative z-10 mt-4 text-center">
          <div className="relative mx-auto h-28 w-28 rounded-full border-4 border-white bg-white shadow-xl overflow-visible">
            <div className="h-full w-full rounded-full overflow-hidden">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName ? `${profile.fullName} avatar` : 'Profile avatar'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-400">
                  <User size={48} strokeWidth={1.5} />
                </div>
              )}
            </div>
            <button
              type="button"
              aria-label="Edit profile picture"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -right-1 -bottom-1 flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shadow-lg ring-1 ring-black/5 transition-transform hover:scale-110 active:scale-95"
            >
              <Pencil size={16} strokeWidth={2.5} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          <div className="mt-4 flex flex-col items-center">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {profile.fullName || (profile.id ? 'ZLon User' : 'ZLon Guest')}
            </h2>
            <p className="text-sm font-medium text-white/70 mb-2">
              {profile.emailAddress || (profile.id ? 'Add email for security' : 'Sign in to sync your bookings')}
            </p>
            {profile.id ? (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-100 to-yellow-200 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-900 ring-1 ring-amber-300 shadow-sm">
                <CheckCircle2 size={12} fill="currentColor" fillOpacity={0.2} />
                ZLon Member
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/70 ring-1 ring-white/20">
                <User size={12} />
                Guest Mode
              </div>
            )}
            <Link
              href="/profile/edit"
              className="mt-3 px-5 py-2 bg-white/15 hover:bg-white/25 text-white text-sm font-semibold rounded-full transition-all flex items-center gap-2 w-fit border border-white/10"
            >
              <Pencil size={14} strokeWidth={2.5} />
              Edit Profile
            </Link>
          </div>
        </section>
      </div>

      <main className="relative z-10 px-5">

        {/* Quick Stats Row */}
        <section className="mt-8 grid grid-cols-2 gap-3">
          <div className="flex flex-col rounded-2xl bg-white p-4 shadow-sm border border-black/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
                <Wallet size={14} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Balance</span>
            </div>
            <p className="text-lg font-bold text-neutral-900">{formatCurrency(profile.walletBalance)}</p>
          </div>

          <div className="flex flex-col rounded-2xl bg-white p-4 shadow-sm border border-black/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
                <Zap size={14} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">AI Scans</span>
            </div>
            <p className="text-lg font-bold text-neutral-900">{profile.id ? aiScansAvailable : 0} Left</p>
          </div>
        </section>

        {/* Settings Groups */}
        <div className="mt-8 space-y-6">
          {/* Group 1: Account & Security */}
          <section>
            <h3 className="ml-1 mb-3 text-xs font-bold uppercase tracking-[0.15em] text-neutral-400">
              Account & Security
            </h3>
            <div className={`${surfaceClass} overflow-hidden divide-y divide-black/5`}>
              <Link prefetch={false} href="/wallet" className="group flex items-center justify-between p-4 transition-colors hover:bg-neutral-50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500 group-hover:bg-black group-hover:text-white transition-colors">
                    <CreditCard size={18} />
                  </div>
                  <span className="text-sm font-semibold text-neutral-900">Wallet Details</span>
                </div>
                <ChevronRight size={16} className="text-neutral-300" />
              </Link>

              <Link prefetch={false} href="/profile/booking-history" className="group flex items-center justify-between p-4 transition-colors hover:bg-neutral-50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500 group-hover:bg-black group-hover:text-white transition-colors">
                    <History size={18} />
                  </div>
                  <span className="text-sm font-semibold text-neutral-900">Booking History</span>
                </div>
                <ChevronRight size={16} className="text-neutral-300" />
              </Link>

              <Link prefetch={false} href="/privacy-settings" className="group flex items-center justify-between p-4 transition-colors hover:bg-neutral-50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500 group-hover:bg-black group-hover:text-white transition-colors">
                    <Shield size={18} />
                  </div>
                  <span className="text-sm font-semibold text-neutral-900">Privacy Settings</span>
                </div>
                <ChevronRight size={16} className="text-neutral-300" />
              </Link>

              <Link prefetch={false} href="/terms-and-conditions" className="group flex items-center justify-between p-4 transition-colors hover:bg-neutral-50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500 group-hover:bg-black group-hover:text-white transition-colors">
                    <FileText size={18} />
                  </div>
                  <span className="text-sm font-semibold text-neutral-900">Terms & Conditions</span>
                </div>
                <ChevronRight size={16} className="text-neutral-300" />
              </Link>
            </div>
          </section>

          {/* Action Button */}
          <div className="pt-4 flex justify-center">
            {profile.id ? (
              <button
                type="button"
                onClick={handleLogOut}
                disabled={isSaving}
                className="flex items-center gap-2 px-8 py-3 rounded-full text-red-500 font-bold text-sm transition-all hover:bg-red-50 active:scale-95"
              >
                <LogOut size={16} />
                {isSaving ? 'Logging out...' : 'Log Out'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push('/')}
                className="flex items-center gap-2 px-8 py-3 rounded-full bg-black text-white font-bold text-sm transition-all hover:bg-neutral-800 active:scale-95 shadow-lg shadow-black/10"
              >
                <LogOut size={16} className="rotate-180" />
                Sign In
              </button>
            )}
          </div>

          {/* App Footer */}
          <footer className="pt-4 pb-0">
            <p className="text-center text-xs font-medium tracking-wide text-gray-400">
              ZLon v{packageJson.version} (Beta)
            </p>
          </footer>
        </div>
      </main>

      {message && (
        <div className="fixed left-1/2 top-4 z-40 w-[calc(100%-2rem)] max-w-[448px] -translate-x-1/2 rounded-2xl bg-black px-4 py-3 text-center text-sm font-semibold text-white shadow-[0_16px_34px_rgba(0,0,0,0.18)]">
          {message}
        </div>
      )}

      <AnimatePresence>
        {activeField && (
          <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60 px-4 pb-24 pt-6">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
                mass: 0.8,
              }}
              className="w-full max-w-[448px] rounded-[2rem] border border-black/10 bg-white p-5 text-neutral-950 shadow-[0_24px_60px_rgba(0,0,0,0.24)]"
            >
              <h2 className="text-xl font-semibold tracking-tight">
                Edit {editableFieldLabels[activeField]}
              </h2>
              <label htmlFor="profile-field-editor" className="mt-4 block text-sm font-medium text-neutral-500">
                {editableFieldLabels[activeField]}
              </label>
              <input
                id="profile-field-editor"
                type={activeField === 'phoneNumber' ? 'tel' : 'text'}
                inputMode={activeField === 'phoneNumber' ? 'tel' : 'text'}
                value={draftValue}
                onChange={(event) => setDraftValue(event.target.value)}
                className="mt-2 w-full rounded-[1.25rem] bg-[#f4f3f0] px-4 py-3 text-base text-neutral-950 outline-none ring-1 ring-black/5 placeholder:text-neutral-400"
                autoFocus
              />
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={closeFieldEditor}
                  disabled={!hasDraftChanges || isSaving}
                  className={`rounded-full border border-black/10 px-5 py-3 text-sm font-semibold transition-colors ${
                    hasDraftChanges
                      ? 'bg-white text-neutral-950 hover:bg-neutral-50'
                      : 'cursor-not-allowed bg-neutral-100 text-neutral-400'
                  }`}
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={saveField}
                  disabled={!hasDraftChanges || isSaving}
                  className={`rounded-full px-5 py-3 text-sm font-semibold transition-opacity ${
                    hasDraftChanges
                      ? 'bg-black text-white hover:opacity-95'
                      : 'cursor-not-allowed bg-neutral-200 text-neutral-400'
                  }`}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <MobileBottomNav />
    </div>
  );
}
