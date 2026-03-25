import { supabaseAdmin } from './src/lib/supabase.js';

async function checkSchema() {
  const { data, error } = await supabaseAdmin.rpc('get_table_info', { table_name: 'activities' });
  if (error) {
    // If RPC fails, try generic query to see constraints if possible
    console.log('RPC Error:', error.message);
    const { data: cols, error: colError } = await supabaseAdmin.from('activities').select('*').limit(1);
    console.log('Columns test:', colError ? colError.message : 'OK');
  } else {
    console.log('Table Info:', JSON.stringify(data, null, 2));
  }

  // Check if we can see foreign keys via information_schema (some Supabase setups allow this via RPC or direct SQL)
  const query = `
    SELECT
        tc.table_schema, 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
    FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='activities';
  `;
  // We can't run raw SQL easily without a custom function. 
  // Let's assume the user ran my earlier audit report SQL which had:
  // user_id UUID REFERENCES auth.users NOT NULL
}

checkSchema();
