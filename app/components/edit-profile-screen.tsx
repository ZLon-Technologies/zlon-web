'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  ChevronRight,
  Mail,
  Mars,
  Pencil,
  Phone,
  Shield,
  UserRound,
  Venus,
  Wallet,
} from 'lucide-react';
import { MobileBottomNav } from './mobile-bottom-nav';

type GenderOption = 'Female' | 'Male' | 'Other';

interface ProfileFormState {
  fullName: string;
  emailAddress: string;
  phoneNumber: string;
  gender: GenderOption;
}

interface QuickLinkItem {
  href: string;
  icon: typeof Wallet;
  title: string;
  description: string;
}

const genderOptions: Array<{
  label: GenderOption;
  icon: typeof Venus;
}> = [
  { label: 'Female', icon: Venus },
  { label: 'Male', icon: Mars },
  { label: 'Other', icon: Shield },
];

const quickLinks: QuickLinkItem[] = [
  {
    href: '/wallet',
    icon: Wallet,
    title: 'ZLon Wallet',
    description: 'Hassle-free wallet payments',
  },
  {
    href: '/profile#privacy',
    icon: Shield,
    title: 'Privacy Settings',
    description: 'Manage personal data and security',
  },
];

const surfaceClass =
  'rounded-[1.5rem] border border-black/10 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.08)]';

export function EditProfileScreen() {
  const [profile, setProfile] = useState<ProfileFormState>({
    fullName: 'Alexandra Sterling',
    emailAddress: 'alexandra.s@sanctuary.luxury',
    phoneNumber: '+91 98765 43210',
    gender: 'Female',
  });
  const [didSave, setDidSave] = useState(false);

  function updateField<K extends keyof ProfileFormState>(
    field: K,
    value: ProfileFormState[K]
  ) {
    setDidSave(false);
    setProfile((previousProfile) => ({
      ...previousProfile,
      [field]: value,
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDidSave(true);
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f6f3] text-neutral-950">
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
          <div className="relative mx-auto flex h-36 w-36 items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,_#ffb98a_18%,_#f29d67_28%,_#17212b_29%,_#17212b_100%)] shadow-[0_16px_32px_rgba(15,23,42,0.14)] ring-4 ring-white">
            <div className="absolute inset-x-6 bottom-0 h-16 rounded-t-[999px] bg-[#253443]" />
            <div className="absolute left-1/2 top-11 h-16 w-16 -translate-x-1/2 rounded-full bg-[#ffbf90]" />
            <div className="absolute left-[3.35rem] top-[2.2rem] h-10 w-14 rotate-6 rounded-[999px] bg-[#6f4328]" />
            <div className="absolute left-[4.9rem] top-[2.55rem] h-8 w-7 rounded-full bg-[#6f4328]" />
            <button
              type="button"
              aria-label="Edit profile picture"
              className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 text-white shadow-lg transition-transform hover:scale-105"
            >
              <Pencil size={20} strokeWidth={2.2} />
            </button>
          </div>

          <h1 className="mt-5 text-2xl font-semibold tracking-tight">The Sanctuary Member</h1>
          <p className="mt-1 text-sm text-neutral-500">Elite Tier Membership</p>
        </section>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <section className={`${surfaceClass} space-y-4 p-5`}>
            <div>
              <label htmlFor="full-name" className="block text-sm font-medium text-neutral-500">
                Full Name
              </label>
              <div className="mt-2 flex items-center gap-3 rounded-[1.25rem] bg-[#f4f3f0] px-4 py-3 ring-1 ring-black/5">
                <UserRound size={20} className="text-neutral-500" strokeWidth={2} />
                <input
                  id="full-name"
                  type="text"
                  value={profile.fullName}
                  onChange={(event) => updateField('fullName', event.target.value)}
                  className="w-full bg-transparent text-base text-neutral-950 outline-none placeholder:text-neutral-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-neutral-500">
                Email Address
              </label>
              <div className="mt-2 flex items-center gap-3 rounded-[1.25rem] bg-[#f4f3f0] px-4 py-3 ring-1 ring-black/5">
                <Mail size={20} className="text-neutral-500" strokeWidth={2} />
                <input
                  id="email-address"
                  type="email"
                  value={profile.emailAddress}
                  onChange={(event) => updateField('emailAddress', event.target.value)}
                  className="w-full bg-transparent text-base text-neutral-950 outline-none placeholder:text-neutral-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone-number" className="block text-sm font-medium text-neutral-500">
                Phone Number
              </label>
              <div className="mt-2 flex items-center gap-3 rounded-[1.25rem] bg-[#f4f3f0] px-4 py-3 ring-1 ring-black/5">
                <Phone size={20} className="text-neutral-500" strokeWidth={2} />
                <input
                  id="phone-number"
                  type="tel"
                  inputMode="tel"
                  value={profile.phoneNumber}
                  onChange={(event) => updateField('phoneNumber', event.target.value)}
                  className="w-full bg-transparent text-base text-neutral-950 outline-none placeholder:text-neutral-400"
                />
              </div>
            </div>

            <div>
              <span className="block text-sm font-medium text-neutral-500">Gender</span>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {genderOptions.map(({ label, icon: Icon }) => {
                  const selected = profile.gender === label;

                  return (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => updateField('gender', label)}
                      className={`flex items-center justify-center gap-2 rounded-[1.1rem] border px-3 py-3 text-sm font-semibold transition-all ${
                        selected
                          ? 'border-neutral-500 bg-white text-neutral-900 shadow-sm'
                          : 'border-black/10 bg-white text-neutral-500 hover:bg-neutral-50'
                      }`}
                    >
                      <Icon size={18} strokeWidth={2} />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="space-y-3">
            {quickLinks.map(({ href, icon: Icon, title, description }) => (
              <Link
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

          <div className="pt-1">
            <button
              type="submit"
              className="w-full rounded-full bg-black px-5 py-4 text-base font-semibold text-white shadow-[0_14px_28px_rgba(0,0,0,0.16)] transition-opacity hover:opacity-95"
            >
              Save Changes
            </button>
            <p
              className={`mt-3 text-center text-sm text-neutral-500 transition-opacity ${
                didSave ? 'opacity-100' : 'opacity-0'
              }`}
              aria-live="polite"
            >
              Changes saved locally for now. We can wire this to Supabase next.
            </p>
          </div>
        </form>
      </main>

      <MobileBottomNav />
    </div>
  );
}
