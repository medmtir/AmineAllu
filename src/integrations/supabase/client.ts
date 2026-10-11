import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

function createSupabaseClient() {
  const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : ({} as any);
  const procEnv = (typeof process !== 'undefined' && process.env) ? process.env : ({} as any);

  const SUPABASE_URL =
    env.VITE_SUPABASE_URL ||
    procEnv.VITE_SUPABASE_URL ||
    env.NEXT_PUBLIC_SUPABASE_URL ||
    procEnv.NEXT_PUBLIC_SUPABASE_URL ||
    procEnv.SUPABASE_URL ||
    'https://kjcimweobuwhhplrdwiu.supabase.co';

  const SUPABASE_PUBLISHABLE_KEY =
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    procEnv.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    procEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    procEnv.SUPABASE_PUBLISHABLE_KEY ||
    'sb_publishable_Q1gJL2KXF-cF6k_NQ7S7hA_oIf2n1y2';

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    const message = 'Missing Supabase environment variable(s). Check your .env file.';
    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
