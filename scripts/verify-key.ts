import { supabaseAdmin } from '../src/lib/supabase.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function checkKey() {
  const apiKey = process.env.SHIPSCRIBE_API_KEY;
  console.log(`Checking key: ${apiKey}`);
  
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, api_key')
      .eq('api_key', apiKey)
      .single();

    if (error) {
      console.error('Error:', error.message);
    } else {
      console.log('Success! Profile found:', data);
    }
  } catch (err: any) {
    console.error('Crash Error:', err.message);
  }
}

checkKey();
