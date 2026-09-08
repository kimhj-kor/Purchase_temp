import { createClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || localStorage.getItem('custom_supabase_url') || '';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || localStorage.getItem('custom_supabase_key') || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
