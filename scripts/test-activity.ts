import { trackActivity } from '../src/tools/activity.js';
import { supabaseAdmin } from '../src/lib/supabase.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testTrackActivity() {
  const apiKey = process.env.SHIPSCRIBE_API_KEY;
  console.log('Testing trackActivity...');
  
  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('api_key', apiKey)
      .single();

    if (!profile) throw new Error('Profile not found');

    const note = 'full pipeline test';
    const project = 'shipscribe';
    
    console.log(`Calling trackActivity with note: "${note}", project: "${project}"`);
    const result = await trackActivity(profile.id, note, project);
    console.log('Result:', result);

    // Verify in DB
    const { data: activity } = await supabaseAdmin
      .from('activities')
      .select('*')
      .eq('user_id', profile.id)
      .eq('note', note)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (activity) {
      console.log('TEST 3 PASSED: Activity found in database!');
    } else {
      console.error('TEST 3 FAILED: Activity not found in database.');
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Test Crash:', err.message);
    process.exit(1);
  }
}

testTrackActivity();
