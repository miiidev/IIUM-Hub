import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_PUBLIC_SUPABASE_URL ??
  import.meta.env.VITE_SUPABASE_URL) as string | undefined;
const supabaseKey = (import.meta.env.VITE_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;

const missing = !supabaseUrl || !supabaseKey;
if (missing) {
  console.warn(
    'Missing Supabase env vars: VITE_PUBLIC_SUPABASE_URL / VITE_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Check .env.'
  );
}

// Never throw on import (blank page). Fall back to placeholder so the app
// still renders and pages show explicit error states instead of crashing.
export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseKey ?? 'placeholder-key'
);

export const isSupabaseConfigured = !missing;
