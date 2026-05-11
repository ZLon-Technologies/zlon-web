'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Small delay to ensure initial render is complete
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-opacity duration-500">
          <div className="relative mb-6">
            <Image
              src="/logo.png"
              alt="ZLon Logo"
              width={80}
              height={80}
              priority
              className="animate-pulse"
            />
            <div className="absolute -inset-4 animate-spin rounded-full border-2 border-transparent border-t-black opacity-20" />
          </div>
          <div className="flex flex-col items-center">
            <p className="text-lg font-bold tracking-[0.2em] text-black">ZLON</p>
            <div className="mt-2 flex gap-1.5">
              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-black [animation-delay:-0.3s]" />
              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-black [animation-delay:-0.15s]" />
              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-black" />
            </div>
          </div>
        </div>
      )}
      <div className={isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-500'}>
        {children}
      </div>
    </>
  );
}
