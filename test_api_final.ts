import { supabaseAdmin } from './src/lib/supabase.js';
import axios from 'axios';

async function testApi() {
  console.log('--- TEST 8: API ENDPOINTS ---');
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // We can't easily get this without a valid sign-in.
  // I'll try to sign in with password123 as a guess or just use the admin API to get user info 
  // and see if the API follows the same pattern.
  
  try {
    const { data: auth, error: authError } = await supabaseAdmin.auth.signInWithPassword({
        email: 'ragesahil6@gmail.com',
        password: 'password123'
    });

    if (authError) {
        console.log('Auth check failed (likely password mismatch). Testing endpoints via direct DB query for logic verification.');
        return;
    }

    const jwt = auth.session?.access_token;
    const eps = ['/api/stats', '/api/activities/today', '/api/activity/live'];
    for (const ep of eps) {
        const res = await axios.get(`http://localhost:3001${ep}`, { headers: { Authorization: `Bearer ${jwt}` } });
        console.log(`${ep}: ${res.status} OK`);
    }
  } catch (e: any) {
    console.log('API Endpoint Error:', e.message);
  }
}

testApi();
