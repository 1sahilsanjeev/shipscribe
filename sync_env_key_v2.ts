import { supabaseAdmin } from './src/lib/supabase.js';
import fs from 'fs';
import path from 'path';

async function updateEnv() {
  const { data: profs } = await supabaseAdmin.from('profiles').select('*').limit(1);
  if (!profs || profs.length === 0) {
    console.error('No profiles found in DB.');
    return;
  }

  const key = profs[0].api_key;
  const envPath = path.resolve('.env');
  let envContent = fs.readFileSync(envPath, 'utf8');

  if (envContent.includes('SHIPSCRIBE_API_KEY=')) {
    envContent = envContent.replace(/SHIPSCRIBE_API_KEY=.*/, `SHIPSCRIBE_API_KEY=${key}`);
  } else {
    envContent = `SHIPSCRIBE_API_KEY=${key}\n` + envContent;
  }

  fs.writeFileSync(envPath, envContent);
  console.log(`Updated .env with API key: [${key}] (Length: ${key.length})`);
}

updateEnv().catch(console.error);
