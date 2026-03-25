import { supabaseAdmin } from './src/lib/supabase.js';
import dotenv from 'dotenv';
dotenv.config();

async function setup() {
  console.log('--- E2E Setup Check ---');
  const tables = ['profiles', 'activities', 'tasks', 'summaries', 'session_state', 'time_sessions'];
  
  for (const table of tables) {
    const { error } = await supabaseAdmin.from(table).select('count', { count: 'exact', head: true }).limit(0);
    if (error) {
      console.log(`[${table}] ❌ Missing or error: ${error.message}`);
    } else {
      console.log(`[${table}] ✅ Table exists`);
    }
  }

  // Check if we have a profile to use for SHIPSCRIBE_API_KEY
  let { data: profiles } = await supabaseAdmin.from('profiles').select('*');
  
  if (!profiles || profiles.length === 0) {
    console.log('No profiles found in "profiles" table.');
    // Let's see if we can just create one for a known email or if we can see auth.users
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    if (users && users.users.length > 0) {
      console.log(`Found ${users.users.length} auth users. Creating profile for first one.`);
      const user = users.users[0];
      const testApiKey = 'sk_live_test_' + Math.random().toString(36).substring(7);
      const { error: profError } = await supabaseAdmin.from('profiles').insert({
        id: user.id,
        email: user.email,
        api_key: testApiKey,
        plan: 'pro'
      });
      if (!profError) console.log(`Profile created for ${user.email} with API key: ${testApiKey}`);
      else console.log('Error creating profile:', profError.message);
    } else {
      console.log('No auth users found either.');
    }
  } else {
    console.log(`Existing API keys found:`);
    profiles.forEach(p => console.log(`- ${p.email}: ${p.api_key}`));
  }
}

setup();
