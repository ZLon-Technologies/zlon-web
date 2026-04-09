import { ConsumerApp } from '@/components/consumer-app';
import { OwnerApp } from '@/components/owner-app';
import { headers } from 'next/headers';

function normalizeHost(host = '') {
  return String(host).split(':')[0];
}

export default async function HomePage() {
  const headerStore = await headers();
  const host = normalizeHost(headerStore.get('x-forwarded-host') || headerStore.get('host') || '');

  if (host === 'mybusiness.zlon.in') {
    return <OwnerApp />;
  }

  return <ConsumerApp />;
}
