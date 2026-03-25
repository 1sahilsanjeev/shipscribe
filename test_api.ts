import { supabaseAdmin } from './src/lib/supabase.js';
import axios from 'axios';

const userId = 'eef06204-bf1e-43f6-8825-b445e514232a';

async function runApiTests() {
  console.log('\n--- TEST 8: API ENDPOINTS ---');
  
  // To test the API, we need a JWT. 
  // We can try to sign one using our local secret if we know it, 
  // or better, use Supabase Auth API to get a session.
  // Since we created the user with password123, let's try to sign in.
  
  try {
    const { data: auth, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: 'test@shipscribe.dev',
      password: 'password123'
    });

    if (authError || !auth.session) {
      console.log('Auth failed:', authError?.message || 'No session');
      return;
    }

    const token = auth.session.access_token;
    console.log('Got test token. Running curl simulations...');

    const endpoints = [
      '/api/stats',
      '/api/activities/today',
      '/api/activity/live'
    ];

    for (const ep of endpoints) {
      try {
        const res = await axios.get(`http://localhost:3001${ep}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log(`- ${ep}: ✅ 200 OK (${JSON.stringify(res.data).substring(0, 100)}...)`);
      } catch (e: any) {
        console.log(`- ${ep}: ❌ ${e.response?.status || 'Error'} (${e.message})`);
      }
    }
  } catch (e: any) {
    console.log('Error in API test runner:', e.message);
  }
}

runApiTests();
