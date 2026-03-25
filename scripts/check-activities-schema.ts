import { supabaseAdmin } from '../src/lib/supabase.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function checkActivitiesSchema() {
  console.log('Checking activities table schema...');
  
  try {
    const { data, error } = await supabaseAdmin
      .from('activities')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error:', error.message);
    } else if (data && data.length > 0) {
      console.log('Sample Activity Columns:', Object.keys(data[0]));
    } else {
      console.log('No activities found to check columns.');
    }
  } catch (err: any) {
    console.error('Crash:', err.message);
  }
}

checkActivitiesSchema();
