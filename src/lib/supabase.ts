import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string

// Graceful fallback — jangan throw agar app tidak crash saat env belum diset
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Supabase] Environment variables tidak ditemukan.\n' +
    'Pastikan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY sudah diset di Vercel dashboard.'
  )
}

export const supabase = createClient<Database>(
  supabaseUrl  || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

// Admin client using service role key (only for specific admin operations if available)
export const supabaseAdmin = (supabaseServiceKey && supabaseUrl) 
  ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    }) 
  : null

