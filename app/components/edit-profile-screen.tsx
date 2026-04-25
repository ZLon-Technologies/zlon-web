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
  'rounded-[2rem] border border-black/10 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]';

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
    <div className="bg-[#f7f6f3] text-neutral-950">
      <div className="mx-auto flex min-h-screen max-w-md flex-col">
        <header className="border-b border-black/6 px-6 py-8">
          <button
            type="button"
            aria-label="Notifications"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-transparent text-black transition-colors hover:bg-white"
          >
            <Bell className="h-7 w-7" strokeWidth={2.1} />
          </button>
        </header>

        <main className="flex-1 px-6 pb-10 pt-6">
          <section className="text-center">
            <div className="relative mx-auto flex h-52 w-52 items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,_#ffb98a_18%,_#f29d67_28%,_#17212b_29%,_#17212b_100%)] shadow-[0_22px_50px_rgba(15,23,42,0.16)] ring-8 ring-white">
              <div className="absolute inset-x-9 bottom-0 h-24 rounded-t-[999px] bg-[#253443]" />
              <div className="absolute left-1/2 top-[3.8rem] h-24 w-24 -translate-x-1/2 rounded-full bg-[#ffbf90]" />
              <div className="absolute left-[4.9rem] top-[2.55rem] h-16 w-20 rotate-6 rounded-[999px] bg-[#6f4328]" />
              <div className="absolute left-[7rem] top-[3.1rem] h-12 w-10 rounded-full bg-[#6f4328]" />
              <button
                type="button"
                aria-label="Edit profile picture"
                className="absolute bottom-6 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-600 text-white shadow-lg transition-transform hover:scale-105"
              >
                <Pencil className="h-6 w-6" strokeWidth={2.4} />
              </button>
            </div>

            <h1 className="mt-8 text-[2.7rem] font-semibold tracking-tight">
              The Sanctuary Member
            </h1>
            <p className="mt-2 text-2xl text-neutral-500">Elite Tier Membership</p>
          </section>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <section className={`${surfaceClass} space-y-6 p-6`}>
              <div>
                <label
                  htmlFor="full-name"
                  className="block text-lg font-semibold text-neutral-500"
                >
                  Full Name
                </label>
                <div className="mt-3 flex items-center gap-4 rounded-[1.75rem] bg-[#f4f3f0] px-5 py-5 ring-1 ring-black/5">
                  <UserRound className="h-7 w-7 text-neutral-500" strokeWidth={2} />
                  <input
                    id="full-name"
                    type="text"
                    value={profile.fullName}
                    onChange={(event) => updateField('fullName', event.target.value)}
                    className="w-full bg-transparent text-2xl text-neutral-950 outline-none placeholder:text-neutral-400"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email-address"
                  className="block text-lg font-semibold text-neutral-500"
                >
                  Email Address
                </label>
                <div className="mt-3 flex items-center gap-4 rounded-[1.75rem] bg-[#f4f3f0] px-5 py-5 ring-1 ring-black/5">
                  <Mail className="h-7 w-7 text-neutral-500" strokeWidth={2} />
                  <input
                    id="email-address"
                    type="email"
                    value={profile.emailAddress}
                    onChange={(event) => updateField('emailAddress', event.target.value)}
                    className="w-full bg-transparent text-2xl text-neutral-950 outline-none placeholder:text-neutral-400"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="phone-number"
                  className="block text-lg font-semibold text-neutral-500"
                >
                  Phone Number
                </label>
                <div className="mt-3 flex items-center gap-4 rounded-[1.75rem] bg-[#f4f3f0] px-5 py-5 ring-1 ring-black/5">
                  <Phone className="h-7 w-7 text-neutral-500" strokeWidth={2} />
                  <input
                    id="phone-number"
                    type="tel"
                    inputMode="tel"
                    value={profile.phoneNumber}
                    onChange={(event) => updateField('phoneNumber', event.target.value)}
                    className="w-full bg-transparent text-2xl text-neutral-950 outline-none placeholder:text-neutral-400"
                  />
                </div>
              </div>

              <div>
                <span className="block text-lg font-semibold text-neutral-500">Gender</span>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {genderOptions.map(({ label, icon: Icon }) => {
                    const selected = profile.gender === label;

                    return (
                      <button
                        key={label}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => updateField('gender', label)}
                        className={`flex items-center justify-center gap-2 rounded-[1.65rem] border px-4 py-4 text-lg font-semibold transition-all ${
                          selected
                            ? 'border-neutral-500 bg-white text-neutral-900 shadow-sm'
                            : 'border-black/10 bg-white text-neutral-500 hover:bg-neutral-50'
                        }`}
                      >
                        <Icon className="h-6 w-6" strokeWidth={2} />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="space-y-4">
              {quickLinks.map(({ href, icon: Icon, title, description }) => (
                <Link
                  key={title}
                  href={href}
                  className={`${surfaceClass} flex items-center gap-4 p-5 transition-transform hover:translate-y-[-1px]`}
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
                    <Icon className="h-8 w-8" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
                    <p className="mt-1 text-base text-neutral-500">{description}</p>
                  </div>
                  <ChevronRight className="h-7 w-7 text-neutral-500" strokeWidth={2.2} />
                </Link>
              ))}
            </section>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full rounded-full bg-black px-6 py-5 text-2xl font-semibold text-white shadow-[0_18px_40px_rgba(0,0,0,0.16)] transition-transform hover:scale-[1.01]"
              >
                Save Changes
              </button>
              <p
                className={`mt-4 text-center text-sm text-neutral-500 transition-opacity ${
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
    </div>
  );
}
