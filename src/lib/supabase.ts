import { createClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as any).env || {};

const isValidUrl = (url: string) => {
  if (!url) return false;
  const lower = url.toLowerCase();
  if (
    lower.includes('your_') ||
    lower.includes('placeholder') ||
    lower.includes('your-project') ||
    lower.includes('example') ||
    lower.includes('your_supabase')
  ) {
    return false;
  }
  return url.startsWith('http://') || url.startsWith('https://');
};

const isValidKey = (key: string) => {
  if (!key) return false;
  const lower = key.toLowerCase();
  if (
    lower.includes('your_') ||
    lower.includes('placeholder') ||
    lower.includes('anon_key') ||
    lower.includes('example') ||
    lower.includes('your_supabase')
  ) {
    return false;
  }
  return key.length > 20;
};

const rawUrl = metaEnv.VITE_SUPABASE_URL || localStorage.getItem('custom_supabase_url') || '';
const rawKey = metaEnv.VITE_SUPABASE_ANON_KEY || localStorage.getItem('custom_supabase_key') || '';

export const isSupabaseConfigured = isValidUrl(rawUrl) && isValidKey(rawKey);

export const supabase = isSupabaseConfigured
  ? createClient(rawUrl, rawKey)
  : null;
