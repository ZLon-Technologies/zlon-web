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

    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return undefined;
    }

    navigator.serviceWorker.register('/sw.js').catch(() => {});
    return undefined;
  }, []);

  return null;
}
