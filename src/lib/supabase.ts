import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config.js';

let supabaseClient: SupabaseClient | null = null;
let supabaseAdminClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = config.supabaseUrl || process.env.SUPABASE_URL;
  const supabaseAnonKey = config.supabaseAnonKey || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[supabase] ✗ Missing SUPABASE_URL or ANON_KEY');
    return null;
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: true, persistSession: false }
  });
  
  console.log('[supabase] ✓ Client initialized');
  return supabaseClient;
}

export function getSupabaseAdmin(): SupabaseClient | null {
  if (supabaseAdminClient) return supabaseAdminClient;

  const supabaseUrl = config.supabaseUrl || process.env.SUPABASE_URL;
  const supabaseServiceKey = config.supabaseServiceKey || process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[supabase] ✗ Missing SUPABASE_URL or SERVICE_KEY');
    return null;
  }

  supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  console.log('[supabase] ✓ Admin client initialized');
  return supabaseAdminClient;
}

/**
 * PROXY EXPORTS: These allow us to keep the same variable names in all files
 * while ensuring the client is only initialized lazily on the first ACTUAL property access.
 * This prevents module-level hangups during Vercel cold starts.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop, receiver) {
    const client = getSupabase();
    if (!client) throw new Error('Supabase client not initialized - missing keys');
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(target, prop, receiver) {
    const client = getSupabaseAdmin();
    if (!client) throw new Error('Supabase admin client not initialized - missing keys');
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});
