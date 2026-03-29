import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';
const supabaseUrl = config.supabaseUrl || process.env.SUPABASE_URL;
const supabaseAnonKey = config.supabaseAnonKey || process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = config.supabaseServiceKey || process.env.SUPABASE_SERVICE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[supabase] FATAL: SUPABASE_URL or SUPABASE_SERVICE_KEY not set');
}
export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: false
        }
    })
    : null;
export const supabaseAdmin = supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null;
console.log('[supabase] Clients checked/initialized');
