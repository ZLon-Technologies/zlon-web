import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, History, KeyRound, Shield, UserRound } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Settings',
};

const surfaceClass =
  'rounded-[1.5rem] border border-black/10 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.08)]';

const accountManagementItems = [
  {
    href: '/change-password',
    icon: KeyRound,
    title: 'Change Password',
    description: 'Update your credentials and keep your account secure.',
  },
  {
    href: '/booking-history',
    icon: History,
    title: 'Booking History',
    description: 'Review your past appointments and rebook in a tap.',
  },
] as const;

const privacyItems = [
  {
    href: '/profile',
    icon: UserRound,
    title: 'Personal Information',
    description: 'Review the details visible on your account.',
  },
  {
    href: '/profile',
    icon: Shield,
    title: 'Data Preferences',
    description: 'Control how your data is stored and managed.',
  },
] as const;

export default function PrivacySettingsPage() {
  return (
    <div className="w-full relative">
      <div className="flex flex-col text-neutral-950">
        <header className="border-b border-black/5 bg-white px-4 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              aria-label="Go back"
              className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-neutral-50"
            >
              <ArrowLeft size={22} />
            </Link>
            <h1 className="text-xl font-semibold tracking-tight">Privacy Settings</h1>
          </div>
        </header>

        <main className="flex-1 space-y-6 px-4 py-4 pb-10">
          <section className={`${surfaceClass} p-5`}>
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Account Management
            </h2>
            <div className="mt-4 space-y-3">
              {accountManagementItems.map(({ href, icon: Icon, title, description }) => (
                <Link
                  key={title}
                  href={href}
                  className="flex items-center gap-3 rounded-[1.25rem] bg-[#f4f3f0] px-4 py-4 transition-colors hover:bg-neutral-100"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-neutral-600 shadow-sm">
                    <Icon size={20} strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold tracking-tight text-neutral-950">
                      {title}
                    </h3>
                    <p className="mt-1 text-sm text-neutral-500">{description}</p>
                  </div>
                  <ChevronRight size={20} className="text-neutral-400" strokeWidth={2.1} />
                </Link>
              ))}
            </div>
          </section>

          <section className={`${surfaceClass} p-5`}>
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Privacy Controls
            </h2>
            <div className="mt-4 space-y-3">
              {privacyItems.map(({ href, icon: Icon, title, description }) => (
                <Link
                  key={title}
                  href={href}
                  className="flex items-center gap-3 rounded-[1.25rem] bg-[#f4f3f0] px-4 py-4 transition-colors hover:bg-neutral-100"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-neutral-600 shadow-sm">
                    <Icon size={20} strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold tracking-tight text-neutral-950">
                      {title}
                    </h3>
                    <p className="mt-1 text-sm text-neutral-500">{description}</p>
                  </div>
                  <ChevronRight size={20} className="text-neutral-400" strokeWidth={2.1} />
                </Link>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
