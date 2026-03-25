import { trackActivity } from './src/tools/activity.js';
import { supabaseAdmin } from './src/lib/supabase.js';
import dotenv from 'dotenv';
dotenv.config();

const userId = 'eef06204-bf1e-43f6-8825-b445e514232a';

async function test() {
  console.log('--- TEST 3: TRACK ACTIVITY TOOL ---');
  try {
    const result = await trackActivity(userId, 'IDE integration test (fixed key)', 'shipscribe');
    console.log('Tool Response:', JSON.stringify(result, null, 2));
    
    await new Promise(r => setTimeout(r, 2000));
    const { data, error } = await supabaseAdmin.from('activities').select('*').eq('user_id', userId).order('timestamp', { ascending: false }).limit(1).single();
    
    if (data && data.note === 'IDE integration test (fixed key)') {
      console.log('✅ Row exists in Supabase');
      console.log('Row ID:', data.id);
    } else {
      console.log('❌ Row not found or mismatch');
    }
  } catch (e: any) {
    console.log('Error:', e.message);
  }
}

test();
