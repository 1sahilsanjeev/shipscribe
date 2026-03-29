import { supabaseAdmin } from '../lib/supabase.js';
export async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const apiKeyHeader = req.headers['x-api-key'];
        if ((!authHeader || !authHeader.startsWith('Bearer ')) && !apiKeyHeader) {
            return res.status(401).json({ error: 'Unauthorized: No authorization token or API key provided' });
        }
        if (!supabaseAdmin) {
            console.error('[auth] Supabase admin client not initialized. Check your environment variables.');
            return res.status(503).json({ error: 'Authentication service unavailable' });
        }
        let user = null;
        if (apiKeyHeader) {
            // API Key Auth path
            const { data: profile, error } = await supabaseAdmin
                .from('profiles')
                .select('id, email')
                .eq('api_key', apiKeyHeader)
                .maybeSingle();
            if (error || !profile) {
                console.error('[auth] API Key validation failed:', error?.message);
                return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
            }
            // Construct user object to match JWT format
            user = { id: profile.id, email: profile.email };
        }
        else if (authHeader) {
            // JWT Auth path
            const token = authHeader.replace('Bearer ', '').trim();
            if (!token) {
                return res.status(401).json({ error: 'Empty token' });
            }
            const { data, error } = await supabaseAdmin.auth.getUser(token);
            user = data?.user;
            if (error || !user) {
                console.warn(`[auth] Unauthorized token: ${error?.message || 'User not found'}`);
                return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
            }
        }
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized: User not found' });
        }
        // Fetch profile data to attach extra fields if needed
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
        // Check if user is admin - ensure user and email exist
        let isAdmin = false;
        if (user?.email) {
            const { data: adminData } = await supabaseAdmin
                .from('admin_users')
                .select('id')
                .eq('email', user.email)
                .maybeSingle();
            isAdmin = !!adminData;
        }
        req.user = {
            ...user,
            profile: profile || {},
            isAdmin
        };
        next();
    }
    catch (err) {
        console.error('[auth] Unexpected error:', err.message);
        return res.status(500).json({ error: 'Authentication error: ' + err.message });
    }
}
