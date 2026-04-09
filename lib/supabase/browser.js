'use client';

import { createClient } from '@supabase/supabase-js';

let browserClient = null;

function storageKeyForApp(hostname, pathname = '/') {
  const normalizedHost = String(hostname || 'local').replace(/[^a-z0-9.-]/gi, '-');
  const appScope = pathname.startsWith('/business') ? 'business' : 'consumer';
  return `zlon-auth-${normalizedHost}-${appScope}`;
}

export function getSupabaseBrowserClient() {
  if (typeof window === 'undefined') {
    throw new Error('Supabase browser client can only run in the browser.');
  }

  if (browserClient) {
    return browserClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }

  browserClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: window.localStorage,
      storageKey: storageKeyForApp(window.location.hostname, window.location.pathname)
    }
  });

  return browserClient;
}
