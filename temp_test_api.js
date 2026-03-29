import { supabase } from './src/lib/supabase.js';
import fetch from 'node-fetch';

async function test() {
  const { data: { session } } = await supabase.auth.getSession();
  // wait we can't reliably get a session in pure node script without logging in.
}
test();
