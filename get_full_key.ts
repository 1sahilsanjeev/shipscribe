import { supabaseAdmin } from './src/lib/supabase.js';
import fs from 'fs';

async function setup() {
  const { data: profs } = await supabaseAdmin.from('profiles').select('*').limit(1);
  if (profs && profs.length > 0) {
    fs.writeFileSync('full_key.txt', profs[0].api_key);
    console.log('Full key written to full_key.txt');
  }
}

setup();
