import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

function getURL() {
  const headerStore = headers();
  const host = headerStore.get('x-forwarded-host') || headerStore.get('host') || 'localhost:3000';
  const protocol = headerStore.get('x-forwarded-proto') || 'http';
  const url = `${protocol}://${host}`;
  return url;
}

export default async function AuthCallbackPage() {
  const client = getSupabaseBrowserClient();
  const { data, error } = await client.auth.getSession();

  if (error) {
    console.error('Auth callback error:', error);
    redirect('/');
  }

  if (data?.session) {
    // Session is established, redirect to appropriate app
    const headerStore = headers();
    const host = headerStore.get('x-forwarded-host') || headerStore.get('host') || '';
    const isBusinessHost = host === 'mybusiness.zlon.in';

    if (isBusinessHost) {
      redirect('/business');
    } else {
      redirect('/');
    }
  }

  redirect('/');
}