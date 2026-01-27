import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function checkSchema() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('=== Checking Database Schema ===\n');

  // Check roles table by selecting one row
  console.log('ROLES table:');
  const { data: role, error: roleError } = await supabase
    .from('roles')
    .select('*')
    .limit(1)
    .single();

  if (roleError) {
    console.log('Error:', roleError.message);
  } else if (role) {
    console.log('Columns:', Object.keys(role).join(', '));
    console.log('Sample row:', JSON.stringify(role, null, 2));
  }

  // Check candidates table
  console.log('\nCANDIDATES table:');
  const { data: candidate, error: candError } = await supabase
    .from('candidates')
    .select('*')
    .limit(1)
    .single();

  if (candError) {
    console.log('Error:', candError.message);
  } else if (candidate) {
    console.log('Columns:', Object.keys(candidate).join(', '));
  }
}

checkSchema().catch(console.error);
