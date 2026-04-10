import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_ZLON_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_ZLON_SUPABASE_ANON_KEY;

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
let browserClient = null;

export function getPublicSupabaseConfig() {
  return {
    url: supabaseUrl || '',
    anonKey: supabaseAnonKey || '',
    isConfigured: Boolean(supabaseUrl && supabaseAnonKey)
  };
}

export function getSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient;
  }

  const { url, anonKey, isConfigured } = getPublicSupabaseConfig();
  if (!isConfigured) {
    throw new Error('Missing NEXT_PUBLIC_ZLON_SUPABASE_URL or NEXT_PUBLIC_ZLON_SUPABASE_ANON_KEY.');
  }

  browserClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  return browserClient;
}

export const getSupabaseClient = getSupabaseBrowserClient;
