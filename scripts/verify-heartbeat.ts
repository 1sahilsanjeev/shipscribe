import { supabaseAdmin } from '../src/lib/supabase.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function verifyHeartbeat() {
  console.log('Verifying heartbeat in Supabase...');
  
  try {
    const { data, error } = await supabaseAdmin
      .from('mcp_connections')
      .select('*')
      .order('last_seen', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching connections:', error.message);
      process.exit(1);
    }

    if (!data || data.length === 0) {
      console.error('No connection records found.');
      process.exit(1);
    }

    const latest = data[0];
    const lastSeen = new Date(latest.last_seen);
    const now = new Date();
    const diffMins = (now.getTime() - lastSeen.getTime()) / 60000;

    console.log('Latest MCP Connection:', {
        editor: latest.editor,
        platform: latest.platform,
        last_seen: latest.last_seen,
        diff_mins: diffMins.toFixed(2)
    });

    if (diffMins < 2) {
      console.log('TEST 2 PASSED: Heartbeat is fresh!');
    } else {
      console.error('TEST 2 FAILED: Heartbeat is stale (> 2 mins).');
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Verification Crash:', err.message);
    process.exit(1);
  }
}

verifyHeartbeat();
