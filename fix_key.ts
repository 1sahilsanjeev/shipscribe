import { supabaseAdmin } from './src/lib/supabase.js';
import fs from 'fs';
import path from 'path';

async function fix() {
  const fixedKey = 'sk_live_test_1234567890';
  
  // Update DB
  const { data: profs } = await supabaseAdmin.from('profiles').select('*').limit(1);
  if (profs && profs.length > 0) {
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ api_key: fixedKey })
      .eq('id', profs[0].id);
    
    if (error) {
      console.error('Error updating DB:', error.message);
      return;
    }
    console.log(`Updated DB profile ${profs[0].email} with key: ${fixedKey}`);
  }

  // Update .env
  const envPath = path.resolve('.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('SHIPSCRIBE_API_KEY=')) {
    envContent = envContent.replace(/SHIPSCRIBE_API_KEY=.*/, `SHIPSCRIBE_API_KEY=${fixedKey}`);
  } else {
    envContent = `SHIPSCRIBE_API_KEY=${fixedKey}\n` + envContent;
  }
  fs.writeFileSync(envPath, envContent);
  console.log('Updated .env with fixed key.');
}

fix().catch(console.error);
