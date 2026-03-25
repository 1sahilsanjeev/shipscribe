import { supabaseAdmin } from './src/lib/supabase.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  console.log('--- USER & CONNECTION AUDIT ---');
  
  try {
    const { data: profiles, error: pError } = await supabaseAdmin.from('profiles').select('id, email, api_key');
    if (pError) throw pError;
    
    console.log('Total Profiles:', profiles.length);
    console.table(profiles);
    
    const { data: connections, error: cError } = await supabaseAdmin.from('mcp_connections').select('*');
    if (cError) throw cError;
    
    console.log('Total Connections:', connections.length);
    const enriched = connections.map(conn => {
      const profile = profiles.find(p => p.id === conn.user_id);
      return {
        ...conn,
        user_email: profile ? profile.email : 'MISSING PROFILE',
        last_seen_epoch: new Date(conn.last_seen).getTime()
      };
    });
    console.table(enriched);
    
    const now = Date.now();
    console.log('Current Server Time (Epoch):', now);
    console.log('Current Server Time (ISO):', new Date(now).toISOString());

  } catch (err) {
    console.error('Audit failed:', err);
  }
  process.exit(0);
}
run();
