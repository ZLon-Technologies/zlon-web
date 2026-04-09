import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_ZLON_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_ZLON_SUPABASE_ANON_KEY

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
let browserClient = null

export const getSupabaseClient = (hostname = '') => {
  if (browserClient) return browserClient

  // 1. Safety Check for you (The Developer)
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("ZLon Error: Environment variables are missing!")
    return null 
  }

  browserClient = createClient(supabaseUrl || '', supabaseAnonKey || '', {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  })

  return browserClient
}

export const supabase = getSupabaseClient()