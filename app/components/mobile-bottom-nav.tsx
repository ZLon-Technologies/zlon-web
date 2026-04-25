'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Home, UserRound, Wallet } from 'lucide-react';

const navigationItems = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/booking', label: 'Booking', icon: CalendarDays },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/profile', label: 'Profile', icon: UserRound },
] as const;

function isActiveRoute(pathname: string, href: string) {
  if (href === '/home') {
    return pathname === '/home' || pathname === '/dashboard';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <div className="sticky bottom-0 z-20 px-4 pb-4 safe-area-pb">
      <nav
        aria-label="Primary navigation"
        className="rounded-[2rem] border border-black/5 bg-white/95 p-3 shadow-[0_-18px_45px_rgba(15,23,42,0.08)] backdrop-blur"
      >
        <ul className="grid grid-cols-4 gap-2">
          {navigationItems.map(({ href, label, icon: Icon }) => {
            const active = isActiveRoute(pathname, href);

            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex h-20 flex-col items-center justify-center rounded-[1.5rem] transition-all ${
                    active
                      ? 'bg-neutral-200 text-black'
                      : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="h-7 w-7" strokeWidth={2.1} />
                  <span className="mt-2 text-xs font-semibold uppercase tracking-[0.18em]">
                    {label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
