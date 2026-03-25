import { supabaseAdmin } from './src/lib/supabase.js';
async function run() {
  console.log('--- Database Connection Check ---');
  try {
    const { data: profile, error: profError } = await supabaseAdmin.from('profiles').select('id, email').limit(1).single();
    if (profError) {
      console.error('Profile lookup failed:', JSON.stringify(profError, null, 2));
    } else {
      console.log('Connected as admin, found test profile:', profile.email);
      
      const { data: connections, error: connError } = await supabaseAdmin.from('mcp_connections').select('*').limit(5);
      if (connError) {
        if (connError.code === '42P01') {
          console.error('CRITICAL: mcp_connections table does NOT exist!');
        } else {
          console.error('mcp_connections query failed:', JSON.stringify(connError, null, 2));
        }
      } else {
        console.log('mcp_connections table exists. Current connections count:', connections.length);
        console.table(connections);
      }
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
  process.exit(0);
}
run();
