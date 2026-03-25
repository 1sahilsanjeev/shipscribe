import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

// Called by MCP server every 60 seconds
router.post('/heartbeat', async (req, res) => {
  const { api_key, editor, platform, node_version } = req.body;
  
  console.log(`[heartbeat] received from ${editor} (${platform})`);

  if (!api_key) {
    return res.status(400).json({ error: 'api_key required' });
  }

  // Look up user by API key
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, plan')
    .eq('api_key', api_key)
    .single();

  if (profileError || !profile) {
    console.error(`[heartbeat] Invalid API key: ${api_key?.slice(0, 10)}...`);
    return res.status(401).json({ error: 'Invalid API key' });
  }

  // Upsert connection record
  const { error: upsertError } = await supabaseAdmin
    .from('mcp_connections')
    .upsert({
      user_id: profile.id,
      editor: editor || 'unknown',
      platform: platform || 'unknown',
      last_seen: new Date().toISOString()
    }, {
      onConflict: 'user_id,editor'
    });

  if (upsertError) {
    console.error('[heartbeat] upsert failed:', upsertError);
  } else {
    console.log(`[heartbeat] ✓ connection recorded for ${profile.email} via ${editor}`);
  }

  res.json({ 
    ok: true, 
    user_id: profile.id,
    plan: profile.plan,
    message: 'Connected to Shipscribe'
  });
});

// Called by dashboard to check connection status
router.get('/mcp-status', authenticate, async (req: any, res) => {
  console.log(`[mcp-status] checking for user: ${req.user.id}`);
  
  const { data: connections, error } = await supabaseAdmin
    .from('mcp_connections')
    .select('*')
    .eq('user_id', req.user.id)
    .order('last_seen', { ascending: false });

  if (error) {
    console.error('[mcp-status] query failed:', error);
    return res.status(500).json({ error: 'Database query failed' });
  }

  if (!connections || connections.length === 0) {
    console.log('[mcp-status] no connections found');
    return res.json({ connected: false, connections: [] });
  }

  const now = new Date();
  const enriched = connections.map(conn => {
    const lastSeen = new Date(conn.last_seen);
    const minsAgo = Math.floor((now.getTime() - lastSeen.getTime()) / 60000);
    return {
      ...conn,
      connected: minsAgo < 2,
      minutes_ago: minsAgo,
      debug_now: now.toISOString(),
      debug_last_seen: lastSeen.toISOString(),
      status: minsAgo < 2 ? 'connected' 
        : minsAgo < 60 ? 'idle' 
        : 'disconnected'
    };
  });

  const anyConnected = enriched.some(c => c.connected);
  console.log(`[mcp-status] found ${enriched.length} connections, ${anyConnected ? 'at least one active' : 'none active'}`);

  res.json({
    connected: anyConnected,
    connections: enriched,
    primary: enriched[0]
  });
});

// Regenerate API Key
router.post('/regenerate-key', authenticate, async (req: any, res) => {
  const userId = req.user.id;
  
  try {
    const newKey = `sk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ api_key: newKey })
      .eq('id', userId)
      .select('api_key')
      .single();
    
    if (error) throw error;
    
    console.log(`[api-key] ✓ Key regenerated for user ${userId}`);
    res.json({ api_key: data.api_key });
  } catch (error: any) {
    console.error('[api-key] regeneration failed:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
