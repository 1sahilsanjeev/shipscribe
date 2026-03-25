import { supabaseAdmin } from './src/lib/supabase.js';

async function verify() {
  const userId = 'eef06204-bf1e-43f6-8825-b445e514232a';
  
  console.log('--- TEST 4 & 6 VERIFICATION ---');

  // Check File Watcher
  const { data: actFW } = await supabaseAdmin
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .eq('source', 'file_watcher')
    .order('timestamp', { ascending: false })
    .limit(1);

  if (actFW && actFW.length > 0) {
    console.log('✅ TEST 4: File Watcher Activity Found:', actFW[0].note);
  } else {
    console.log('❌ TEST 4: No File Watcher Activity Found.');
  }

  // Check Connections / Heartbeat
  const { data: conns, error: connError } = await supabaseAdmin.from('mcp_connections').select('*').limit(1);
  if (connError) {
    console.log('❌ TEST 6: mcp_connections table missing or error:', connError.message);
  } else if (conns && conns.length > 0) {
    console.log('✅ TEST 6: MCP Connection recorded.');
  } else {
    console.log('❌ TEST 6: Table exists but no connections found yet.');
  }

  // Check active session state (Test 7/8 support)
  const { data: session } = await supabaseAdmin.from('session_state').select('*').eq('user_id', userId).eq('is_active', true).limit(1);
  if (session && session.length > 0) {
    console.log('✅ LIVE SESSION: Found active session for', session[0].project);
  } else {
    console.log('ℹ️ No active session in session_state table.');
  }
}

verify();
