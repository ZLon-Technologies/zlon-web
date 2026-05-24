'use client';

import { usePathname } from 'next/navigation';

export function RootWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Routes that should NOT have the 480px mobile constraint
  // The landing page should be full-width for a premium desktop experience.
  const isLandingPage = pathname === '/';
  
  if (isLandingPage) {
    return <main className="w-full min-h-screen bg-white">{children}</main>;
  }

  return (
    <div className="mx-auto max-w-[480px] w-full min-h-screen bg-white relative shadow-2xl flex flex-col pb-20 safe-area-pb overflow-x-hidden">
      {children}
    </div>
  );
}
