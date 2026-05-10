import { createClient as createSupabaseClient } from '@supabase/supabase-js';
// import { createServerClient } from '@supabase/ssr';
// import { cookies } from 'next/headers';
import { getSupabaseConfig } from './config';

/**
 * createClient is disabled for static export as it depends on 'next/headers'.
 * refactor to client-side Supabase calls for Capacitor.
 */
export async function createClient() {
  throw new Error('createClient (SSR) is not supported in static export mode.');
}

export function createAdminClient() {
  const { url, serviceRoleKey } = getSupabaseConfig();

  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable.');
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
