'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const { loading: authLoading } = useAuth();
  const [minDelayDone, setMinDelayDone] = useState(false);

  useEffect(() => {
    // Minimum visual delay so the splash doesn't flicker on fast connections
    const timer = setTimeout(() => {
      setMinDelayDone(true);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Stay on the splash screen until BOTH conditions are met:
  // 1. The minimum visual delay (800ms) has elapsed
  // 2. Firebase Auth has resolved its initial state from IndexedDB
  const isReady = minDelayDone && !authLoading;

  return (
    <>
      {!isReady && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white">
          <div className="relative">
            <Image
              src="/logo.png"
              alt="ZLon"
              width={120}
              height={120}
              priority
              className="object-contain animate-pulse"
            />
          </div>
        </div>
      )}
      <div className={!isReady ? 'opacity-0' : 'opacity-100 transition-opacity duration-500'}>
        {children}
      </div>
    </>
  );
}

