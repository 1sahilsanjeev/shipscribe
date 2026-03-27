import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    const user = data?.user;

    if (error || !user) {
      console.warn(`[auth] Unauthorized token: ${error?.message || 'User not found'}`);
      return res.status(401).json({ error: 'Unauthorized: Invalid token or user not found' });
    }

    // Fetch profile data to attach extra fields if needed
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Check if user is admin
    const { data: adminData } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('email', user.email)
      .maybeSingle();

    req.user = { 
      ...user,
      profile: profile || {},
      isAdmin: !!adminData
    };
    
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
}
