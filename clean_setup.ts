import { supabaseAdmin } from './src/lib/supabase.js';
import fs from 'fs';
import path from 'path';

async function createCleanUser() {
  const email = 'e2e@shipscribe.dev';
  const password = 'PasswordE2E123!';
  const apiKey = 'sk_live_e2e_test_99999999';

  console.log('--- CLEAN USER SETUP ---');

  // 1. Create Auth User
  const { data: auth, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authError) {
    console.error('Auth Error:', authError.message);
    if (authError.message.includes('already registered')) {
      console.log('User already exists. Fetching...');
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const user = users.users.find(u => u.email === email);
      if (user) {
        return setupProfile(user.id, email, apiKey);
      }
    }
    return;
  }

  return setupProfile(auth.user.id, email, apiKey);
}

async function setupProfile(id: string, email: string, apiKey: string) {
  // 2. Create Profile
  const { error: profError } = await supabaseAdmin.from('profiles').upsert({
    id,
    email,
    api_key: apiKey,
    plan: 'pro'
  });

  if (profError) {
    console.error('Profile Error:', profError.message);
    return;
  }

  console.log(`✅ User & Profile ready: ${email} (${id})`);
  console.log(`API Key: ${apiKey}`);

  // 3. Update .env
  const envPath = path.resolve('.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  envContent = envContent.replace(/SHIPSCRIBE_API_KEY=.*/, `SHIPSCRIBE_API_KEY=${apiKey}`);
  fs.writeFileSync(envPath, envContent);
  console.log('Updated .env with CLEAN key.');
}

createCleanUser().catch(console.error);
