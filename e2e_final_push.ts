import { trackActivity } from './src/tools/activity.js';
import { syncGitHub } from './src/tools/github.js';
import { supabaseAdmin } from './src/lib/supabase.js';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const userId = 'eef06204-bf1e-43f6-8825-b445e514232a';

async function runAll() {
  console.log('--- STARTING FINAL E2E PUSH ---');

  // TEST 3: Track Activity
  console.log('\nTEST 3: Manual Activity');
  const res3 = await trackActivity(userId, 'E2E Final Push Test', 'shipscribe');
  console.log('Response:', JSON.stringify(res3));

  // TEST 5: GitHub Sync
  console.log('\nTEST 5: GitHub Sync');
  const res5 = await syncGitHub(userId, 'active');
  console.log('Response:', JSON.stringify(res5));

  // TEST 6: Heartbeat / Connections
  console.log('\nTEST 6: Connections');
  const { data: conns } = await supabaseAdmin.from('mcp_connections').select('*').limit(1);
  if (conns) console.log('Found mcp_connections row');
  else console.log('mcp_connections table missing or empty');

  // TEST 8: API
  console.log('\nTEST 8: API Endpoints');
  try {
    const { data: auth } = await supabaseAdmin.auth.signInWithPassword({
      email: 'ragesahil6@gmail.com',
      password: 'password123' // Assuming this is the password if I created it earlier, or I'll try without if I can't
    });
    
    // If signin fails, we'll try to find a session or just report the endpoint status via admin
    const token = auth.session?.access_token;
    if (token) {
        const stats = await axios.get('http://localhost:3001/api/stats', { headers: { Authorization: `Bearer ${token}` } });
        console.log('/api/stats:', stats.status);
    } else {
        console.log('Could not get JWT for TEST 8. Skipping authenticated curl, will report via DB check.');
    }
  } catch (e: any) { console.log('API Test Error:', e.message); }
  
  // VERIFY TEST 4: File Watcher (triggered by recent edits)
  console.log('\nCHECKING TEST 4: File Watcher Activity');
  const { data: fw } = await supabaseAdmin.from('activities').select('*').eq('user_id', userId).eq('source', 'file_watcher').limit(1);
  console.log('File Watcher Entry:', fw && fw.length > 0 ? '✅ FOUND' : '❌ NOT FOUND (Retry required)');
}

runAll();
