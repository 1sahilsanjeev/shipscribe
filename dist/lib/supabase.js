import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';
if (!config.supabaseUrl || !config.supabaseAnonKey || !config.supabaseServiceKey) {
    console.error("CRITICAL ERROR: Supabase environment variables are missing.");
}
// anon key - for user-scoped operations (honors RLS)
export const supabase = createClient(config.supabaseUrl || '', config.supabaseAnonKey || '');
// service key - for server-side admin operations (bypasses RLS)
export const supabaseAdmin = createClient(config.supabaseUrl || '', config.supabaseServiceKey || '', {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
