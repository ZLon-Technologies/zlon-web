'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Small delay to ensure initial React render is complete
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white">
          <div className="relative">
            <Image
              src="/logo.png"
              alt="ZLon"
              width={100}
              height={100}
              priority
              className="object-contain"
            />
          </div>
        </div>
      )}
      <div className={isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-500'}>
        {children}
      </div>
    </>
  );
}
