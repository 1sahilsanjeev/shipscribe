import { supabaseAdmin } from './src/lib/supabase.js';

async function diagnose() {
  const tables = ['profiles', 'activities', 'tasks', 'summaries', 'session_state', 'time_sessions'];
  console.log('--- Supabase Schema Audit ---');
  
  for (const table of tables) {
    try {
      const { error } = await supabaseAdmin.from(table).select('*').limit(0);
      if (error) {
        console.log(`[${table}] ❌ Error: ${error.message} (${error.code})`);
      } else {
        console.log(`[${table}] ✅ Table found`);
      }
    } catch (e: any) {
      console.log(`[${table}] ❌ Crash: ${e.message}`);
    }
  }
}

diagnose();
