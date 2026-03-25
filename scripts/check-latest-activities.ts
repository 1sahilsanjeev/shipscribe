import { supabaseAdmin } from '../src/lib/supabase.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function checkLatestActivities() {
  try {
    const { data, error } = await supabaseAdmin
      .from('activities')
      .select('id, note, source, editor, timestamp')
      .order('timestamp', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error:', error.message);
    } else {
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err: any) {
    console.error('Crash:', err.message);
  }
}

checkLatestActivities();
