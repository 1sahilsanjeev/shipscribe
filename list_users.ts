import { supabaseAdmin } from './src/lib/supabase.js';

async function list() {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Auth Users:');
    data.users.forEach(u => console.log(`- ${u.email} (${u.id})`));
  }
}

list();
