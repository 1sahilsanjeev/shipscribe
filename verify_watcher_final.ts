import { supabaseAdmin } from './src/lib/supabase.js';

async function verify() {
  const userId = 'eef06204-bf1e-43f6-8825-b445e514232a';
  console.log('--- TEST 4: FILE WATCHER (LAST 30S) ---');
  
  const thirtySecsAgo = new Date(Date.now() - 30000).toISOString();
  
  const { data, error } = await supabaseAdmin
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .eq('source', 'file_watcher')
    .gt('timestamp', thirtySecsAgo)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error:', error.message);
  } else if (data && data.length > 0) {
    console.log('✅ TEST 4 SUCCESS');
    data.forEach(a => console.log(`- ${a.note} (${a.timestamp})`));
  } else {
    console.log('❌ Still no recent file watcher entries.');
  }
}

setTimeout(verify, 5000); // Wait for debounce and network
