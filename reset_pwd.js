import { supabaseAdmin } from './dist/lib/supabase.js';

async function resetPassword() {
  console.log('--- Resetting Password for ragesahil6@gmail.com ---');
  
  // Find the user's ID from auth.users (via admin API)
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (listError) {
    console.error('Error listing users:', listError.message);
    return;
  }

  const user = users.find(u => u.email === 'ragesahil6@gmail.com');
  
  if (!user) {
    console.error('User ragesahil6@gmail.com not found.');
    return;
  }

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    user.id,
    { password: 'password123' }
  );

  if (error) {
    console.error('Error resetting password:', error.message);
  } else {
    console.log('✅ Password successfully reset to: password123');
  }
  process.exit(0);
}

resetPassword();
