import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Prevent multiple instances during Vite hot-reload
const globalAny = globalThis as any;

export const supabase =
  globalAny.__supabaseClient ??
  createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

if (!globalAny.__supabaseClient) {
  globalAny.__supabaseClient = supabase;
}
