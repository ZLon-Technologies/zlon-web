import { ConsumerApp } from '@/components/consumer-app';
import { OwnerApp } from '@/components/owner-app';
import { headers } from 'next/headers';

const BUSINESS_HOST = 'mybusiness.zlon.in';

function normalizeHost(host = '') {
  const firstHost = String(host || '').split(',')[0]?.trim() || '';
  return firstHost.split(':')[0]?.trim().toLowerCase() || '';
}

export default async function HomePage() {
  const headerStore = await headers();
  const host = normalizeHost(headerStore.get('x-forwarded-host') || headerStore.get('host') || '');

  if (host === BUSINESS_HOST) {
    return <OwnerApp />;
  }

  return <ConsumerApp />;
}
