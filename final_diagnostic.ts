import { supabaseAdmin } from './src/lib/supabase.js';

async function finalCheck() {
  console.log('--- FINAL DIAGNOSTIC ---');
  
  // 1. Check profiles
  const { data: profs, error: profError } = await supabaseAdmin.from('profiles').select('*');
  if (profError) {
    console.error('Error reading profiles:', profError.message);
  } else {
    console.log(`Found ${profs?.length || 0} profiles.`);
    profs?.forEach(p => console.log(`- ${p.email} | ID: ${p.id} | Key: ${p.api_key}`));
  }

  // 2. Check if we can insert ANY activity (even with a null user_id if allowed, or random UUID)
  // This tests if the table is even writable.
  const testId = '00000000-0000-0000-0000-000000000000';
  const { error: insError } = await supabaseAdmin.from('activities').insert({
    user_id: profs?.[0]?.id || testId,
    note: 'E2E Final Diagnostic',
    source: 'e2e_diagnostic',
    project: 'shipscribe'
  });

  if (insError) {
    console.error('❌ Insertion Failed:', insError.message);
    console.error('Constraint detail:', JSON.stringify(insError, null, 2));
  } else {
    console.log('✅ Insertion Worked!');
  }
}

finalCheck();
