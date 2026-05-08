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
} from 'lucide-react';
import { createClient as createSupabaseBrowserClient } from '@/lib/supabase/client';
import { MobileBottomNav } from './mobile-bottom-nav';
import { useBooking } from '../lib/booking-state';

interface ProfileState {
  id: string;
  fullName: string;
  emailAddress: string;
  phoneNumber: string;
  gender: string;
  avatarUrl: string;
}

interface ProfileRecord {
  id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  gender: string | null;
  avatar_url: string | null;
}

interface EditProfileScreenProps {
  initialProfile: ProfileRecord | null;
}

interface QuickLinkItem {
  href: string;
  icon: typeof Wallet;
  title: string;
  description: string;
}

type EditableField = 'fullName' | 'phoneNumber' | 'gender';

const quickLinks: QuickLinkItem[] = [
  {
    href: '/wallet',
    icon: Wallet,
    title: 'ZLon Wallet',
    description: 'Hassle-free wallet payments',
  },
  {
    href: '/privacy-settings',
    icon: Shield,
    title: 'Privacy Settings',
    description: 'Manage personal data and security',
  },
  {
    href: '/profile/booking-history',
    icon: History,
    title: 'Booking History',
    description: 'See completed appointments and rebook your favorites',
  },
];

const surfaceClass =
  'rounded-[1.5rem] border border-black/10 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.08)]';

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

  const currentFieldValue = activeField ? profile[activeField] : '';
  const hasDraftChanges = activeField !== null && draftValue !== currentFieldValue;

  function openFieldEditor(field: EditableField) {
    setActiveField(field);
    setDraftValue(profile[field]);
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
    <div className="flex flex-col text-neutral-950">
      <header className="border-b border-black/5 px-4 py-4">
        <button
          type="button"
          aria-label="Notifications"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-transparent text-black transition-colors hover:bg-white"
        >
          <Bell size={20} strokeWidth={2.1} />
        </button>
      </header>

      <main className="flex-1 px-4 py-4 pb-20">
        <section className="text-center">
          <div className="relative mx-auto h-24 w-24 aspect-square overflow-hidden rounded-full border border-gray-200 bg-white shadow-[0_16px_32px_rgba(15,23,42,0.14)] ring-4 ring-white">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt={profile.fullName ? `${profile.fullName} avatar` : 'Profile avatar'}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-500">
                <UserRound size={36} strokeWidth={1.8} />
              </div>
            )}
            <button
              type="button"
              aria-label="Edit profile picture"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 text-white shadow-lg transition-transform hover:scale-105"
            >
              <Pencil size={20} strokeWidth={2.2} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          <h1 className="mt-5 text-2xl font-semibold tracking-tight">
            {profile.fullName || 'Your Profile'}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {profile.emailAddress || 'Customer Profile'}
          </p>
        </section>

        <div className="mt-6 space-y-4">
          <section className={`${surfaceClass} space-y-4 p-5`}>
            <div>
              <span className="block text-sm font-medium text-neutral-500">
                Full Name
              </span>
              <div className="mt-2 flex items-center gap-3 rounded-[1.25rem] bg-[#f4f3f0] px-4 py-3 ring-1 ring-black/5">
                <UserRound size={20} className="text-neutral-500" strokeWidth={2} />
                <span className="min-w-0 flex-1 truncate text-left text-base text-neutral-950">
                  {getDisplayValue(profile.fullName)}
                </span>
                <button
                  type="button"
                  onClick={() => openFieldEditor('fullName')}
                  aria-label="Edit full name"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-white hover:text-black"
                >
                  <Pencil size={16} strokeWidth={2.2} />
                </button>
              </div>
            </div>

            <div>
              <span className="block text-sm font-medium text-neutral-500">
                Email Address
              </span>
              <div className="mt-2 flex items-center gap-3 rounded-[1.25rem] bg-[#f4f3f0] px-4 py-3 ring-1 ring-black/5">
                <Mail size={20} className="text-neutral-500" strokeWidth={2} />
                <span className="min-w-0 flex-1 truncate text-left text-base text-neutral-950">
                  {getDisplayValue(profile.emailAddress)}
                </span>
              </div>
            </div>

            <div>
              <span className="block text-sm font-medium text-neutral-500">
                Phone Number
              </span>
              <div className="mt-2 flex items-center gap-3 rounded-[1.25rem] bg-[#f4f3f0] px-4 py-3 ring-1 ring-black/5">
                <Phone size={20} className="text-neutral-500" strokeWidth={2} />
                <span className="min-w-0 flex-1 truncate text-left text-base text-neutral-950">
                  {getDisplayValue(profile.phoneNumber)}
                </span>
                <button
                  type="button"
                  onClick={() => openFieldEditor('phoneNumber')}
                  aria-label="Edit phone number"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-white hover:text-black"
                >
                  <Pencil size={16} strokeWidth={2.2} />
                </button>
              </div>
            </div>

            <div>
              <span className="block text-sm font-medium text-neutral-500">Gender</span>
              <div className="mt-2 flex items-center gap-3 rounded-[1.25rem] bg-[#f4f3f0] px-4 py-3 ring-1 ring-black/5">
                <Shield size={20} className="text-neutral-500" strokeWidth={2} />
                <span className="min-w-0 flex-1 truncate text-left text-base text-neutral-950">
                  {getDisplayValue(profile.gender)}
                </span>
                <button
                  type="button"
                  onClick={() => openFieldEditor('gender')}
                  aria-label="Edit gender"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-white hover:text-black"
                >
                  <Pencil size={16} strokeWidth={2.2} />
                </button>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            {quickLinks.map(({ href, icon: Icon, title, description }) => (
              <Link prefetch={false}
                key={title}
                href={href}
                className={`${surfaceClass} flex items-center gap-3 p-4 transition-transform hover:translate-y-[-1px]`}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
                  <Icon size={20} strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold tracking-tight">{title}</h2>
                  <p className="mt-1 text-sm text-neutral-500">{description}</p>
                </div>
                <ChevronRight size={20} className="text-neutral-500" strokeWidth={2.1} />
              </Link>
            ))}
          </section>

          <section>
            <button
              type="button"
              onClick={handleLogOut}
              disabled={isSaving}
              className={`${surfaceClass} flex w-full items-center gap-3 p-4 text-red-600 transition-colors hover:bg-red-50`}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <LogOut size={20} strokeWidth={2.2} />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <h2 className="text-base font-semibold tracking-tight">Log Out</h2>
                <p className="mt-1 text-sm text-red-500/70">Sign out of your account</p>
              </div>
              <ChevronRight size={20} className="text-red-300" strokeWidth={2.1} />
            </button>
          </section>
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
