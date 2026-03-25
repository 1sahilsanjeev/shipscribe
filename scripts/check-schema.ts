import { supabaseAdmin } from '../src/lib/supabase.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function checkSchema() {
  const tables = ['profiles', 'activities', 'tasks', 'mcp_connections', 'session_state'];
  
  for (const table of tables) {
    const { error } = await supabaseAdmin.from(table).select('*').limit(1);
    if (error) {
      console.log(`[ ] ${table}: MISSING or ERROR (${error.message})`);
    } else {
      console.log(`[x] ${table}: OK`);
    }
  }
}

checkSchema();
