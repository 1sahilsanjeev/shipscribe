import { supabaseAdmin } from './src/lib/supabase.js';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  const apiKey = process.env.SHIPSCRIBE_API_KEY;
  console.log(`Checking API Key from .env: [${apiKey}] (length: ${apiKey?.length})`);
  
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, api_key')
    .eq('api_key', apiKey || '')
    .single();

  if (error) {
    console.error('Supabase Error:', error.message);
    
    // List all keys to see what we have
    const { data: all } = await supabaseAdmin.from('profiles').select('email, api_key');
    console.log('Available keys in DB:');
    all?.forEach(p => console.log(`- ${p.email}: [${p.api_key}] (length: ${p.api_key.length})`));
  } else {
    console.log('✅ Found matching profile:', profile.email);
  }
}

check();
