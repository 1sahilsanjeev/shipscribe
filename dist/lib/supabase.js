import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';
let _supabase = null;
let _supabaseAdmin = null;
export function getSupabase() {
    if (_supabase)
        return _supabase;
    const supabaseUrl = config.supabaseUrl || process.env.SUPABASE_URL;
    const supabaseAnonKey = config.supabaseAnonKey || process.env.SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
        const missing = [];
        if (!supabaseUrl)
            missing.push('SUPABASE_URL');
        if (!supabaseAnonKey)
            missing.push('SUPABASE_ANON_KEY');
        console.error(`[supabase] ✗ Initialization failed. Missing: ${missing.join(', ')}`);
        throw new Error(`[supabase] ✗ Missing ${missing.join(' or ')}`);
    }
    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { autoRefreshToken: true, persistSession: false }
    });
    console.log('[supabase] ✓ Client initialized');
    return _supabase;
}
export function getSupabaseAdmin() {
    if (_supabaseAdmin)
        return _supabaseAdmin;
    const supabaseUrl = config.supabaseUrl || process.env.SUPABASE_URL;
    const supabaseServiceKey = config.supabaseServiceKey || process.env.SUPABASE_SERVICE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
        const missing = [];
        if (!supabaseUrl)
            missing.push('SUPABASE_URL');
        if (!supabaseServiceKey)
            missing.push('SUPABASE_SERVICE_KEY');
        const context = process.env.VERCEL ? 'Vercel Dashboard' : '.env file';
        const msg = `[supabase] ✗ Missing ${missing.join(' or ')}. Please check your ${context}.`;
        console.error(`[supabase] ✗ Admin initialization failed. ${msg}`);
        throw new Error(msg);
    }
    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
    console.log('[supabase] ✓ Admin client initialized');
    return _supabaseAdmin;
}
/**
 * STABLE LAZY EXPORTS:
 * We use a manual wrapper object that forwards the most common methods.
 * This is 100% compatible with Express and all Node.js runtimes, unlike Proxy.
 */
export const supabaseAdmin = {
    get from() { return getSupabaseAdmin().from.bind(getSupabaseAdmin()); },
    get auth() { return getSupabaseAdmin().auth; },
    get rpc() { return getSupabaseAdmin().rpc.bind(getSupabaseAdmin()); },
    get storage() { return getSupabaseAdmin().storage; }
};
export const supabase = {
    get from() { return getSupabase().from.bind(getSupabase()); },
    get auth() { return getSupabase().auth; },
    get rpc() { return getSupabase().rpc.bind(getSupabase()); },
    get storage() { return getSupabase().storage; }
};
