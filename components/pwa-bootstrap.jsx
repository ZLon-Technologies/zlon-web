'use client';

import { useEffect } from 'react';

export function PwaBootstrap() {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    if (!('serviceWorker' in navigator)) {
      return undefined;
    }

    // Unregister all service workers to bypass broken PWA caching
    // This ensures the app loads fresh from the network without cache errors
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().catch(() => {});
        });
      })
      .catch(() => {});

    return undefined;
  }, []);

  return null;
}
