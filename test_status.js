import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const url = 'http://localhost:3001/api/auth/mcp-status';
  
  // Need to simulate a logged in user with a JWT
  // But wait, I can just use supabaseAdmin to get the user id directly if I skip the middleware
  // Or I can generate a JWT if I knew the secret.
  
  // Actually, I'll just check the logic in a standalone script by calling the same DB query
  const { supabaseAdmin } = await import('./src/lib/supabase.js');
  
  const testUserId = '09292376-7917-48f5-9689-b445e514232a'; // From previous log
  
  console.log(`Checking status for user: ${testUserId}`);
  
  const { data: connections, error } = await supabaseAdmin
    .from('mcp_connections')
    .select('*')
    .eq('user_id', testUserId)
    .order('last_seen', { ascending: false });

  if (error) {
    console.error('Query failed:', error);
  } else {
    console.log('Connections found:', connections.length);
    const now = new Date();
    const enriched = connections.map(conn => {
      const lastSeen = new Date(conn.last_seen);
      const minsAgo = Math.floor((now.getTime() - lastSeen.getTime()) / 60000);
      return {
        editor: conn.editor,
        last_seen: conn.last_seen,
        mins_ago: minsAgo,
        connected: minsAgo < 2
      };
    });
    console.table(enriched);
  }
  process.exit(0);
}

run();
