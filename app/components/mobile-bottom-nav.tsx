'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Home, UserRound, Wallet } from 'lucide-react';

const navigationItems = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/booking-history', label: 'Bookings', icon: CalendarDays },
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
    <div className="fixed bottom-0 left-0 right-0 z-20 w-full bg-white border-t border-black/10">
      <nav aria-label="Primary navigation" className="px-2 py-2">
        <ul className="grid grid-cols-4 gap-2">
          {navigationItems.map(({ href, label, icon: Icon }) => {
            const active = isActiveRoute(pathname, href);

            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex h-16 flex-col items-center justify-center rounded-[1.25rem] transition-all ${
                    active
                      ? 'bg-neutral-200 text-black'
                      : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon size={20} strokeWidth={2.1} />
                  <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em]">
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
