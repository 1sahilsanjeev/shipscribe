import { supabaseAdmin } from './src/lib/supabase.js';

async function setup() {
  const { data: profs } = await supabaseAdmin.from('profiles').select('*').limit(1);
  if (!profs || profs.length === 0) {
    console.log('No profiles found.');
    return;
  }
  const user = profs[0];
  console.log(`User ID: ${user.id}`);
  console.log(`API Key: ${user.api_key}`);
}

setup();
