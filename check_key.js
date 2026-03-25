import { supabaseAdmin } from './src/lib/supabase.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const apiKey = process.env.SHIPSCRIBE_API_KEY;
  console.log(`Checking API Key: ${apiKey}`);
  
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, api_key')
    .eq('api_key', apiKey)
    .single();

  if (error) {
    console.error('API Key lookup failed:', JSON.stringify(error, null, 2));
    
    console.log('Listing all profiles to find correct key...');
    const { data: profiles } = await supabaseAdmin.from('profiles').select('id, email, api_key');
    console.table(profiles);
  } else {
    console.log('✓ API Key is valid for user:', profile.email);
  }
  process.exit(0);
}
run();
