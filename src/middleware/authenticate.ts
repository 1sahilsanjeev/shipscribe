import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const apiKeyHeader = req.headers['x-api-key'];

    if (!supabaseAdmin) {
      console.error('[auth] Supabase admin client not initialized. Check your environment variables.');
      return res.status(503).json({ error: 'Authentication service unavailable' });
    }

    if ((!authHeader || !authHeader.startsWith('Bearer ')) && !apiKeyHeader) {
      return res.status(401).json({ error: 'Unauthorized: No authorization token or API key provided' });
    }

    let user: any = null;

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
      
      user = { id: profile.id, email: profile.email };

    } else if (authHeader) {
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

    // Fetch profile and check admin in parallel for better performance
    const [{ data: profile }, { data: adminData }] = await Promise.all([
      supabaseAdmin.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabaseAdmin.from('admin_users').select('id').eq('email', user.email || '').maybeSingle()
    ]);

    req.user = { 
      ...user,
      profile: profile || {},
      isAdmin: !!adminData
    };
    
    next();
  } catch (err: any) {
    console.error('[auth] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Authentication error: ' + err.message });
  }
}
