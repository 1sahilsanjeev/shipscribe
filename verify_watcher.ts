import { supabaseAdmin } from './src/lib/supabase.js';

async function verify() {
  console.log('--- TEST 4: FILE WATCHER VERIFICATION ---');
  const userId = 'eef06204-bf1e-43f6-8825-b445e514232a';
  
  const { data, error } = await supabaseAdmin
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .eq('source', 'file_watcher')
    .order('timestamp', { ascending: false })
    .limit(5);

  if (error) {
    console.log('Error:', error.message);
  } else if (data && data.length > 0) {
    console.log(`Found ${data.length} file watcher entries.`);
    data.forEach(a => console.log(`- ${a.note} (${a.timestamp})`));
    console.log('✅ TEST 4 SUCCESS');
  } else {
    console.log('❌ No file watcher entries found. Check if the watcher is running and not debounced.');
  }
}

verify();
