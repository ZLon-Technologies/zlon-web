import { OwnerApp } from '@/components/owner-app';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

function normalizeHost(host = '') {
  return String(host).split(':')[0];
}

export default async function BusinessPage() {
  const headerStore = await headers();
  const host = normalizeHost(headerStore.get('x-forwarded-host') || headerStore.get('host') || '');

  if (host === 'mybusiness.zlon.in') {
    redirect('/');
  }

  return <OwnerApp />;
}
