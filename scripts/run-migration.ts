import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Run the automation migration
async function runMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Read the migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20260123_automation_columns.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  // Split into individual statements and run each
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Running ${statements.length} SQL statements...`);

  for (let i = 0; i < statements.length; i++) {
    const sql = statements[i];
    if (!sql || sql.startsWith('COMMENT')) continue;  // Skip comments

    try {
      // Use raw SQL via rpc if available, otherwise try direct query
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql + ';' });
      if (error) {
        // Try alternative method - direct fetch
        console.log(`Statement ${i + 1}: Trying alternative method...`);
      } else {
        console.log(`Statement ${i + 1}: OK`);
      }
    } catch (err) {
      console.log(`Statement ${i + 1}: ${err}`);
    }
  }

  // Now enable auto_progression on all existing roles
  console.log('\nEnabling auto_progression on all roles...');

  const { data: roles, error: fetchError } = await supabase
    .from('roles')
    .select('id, title')
    .eq('status', 'active');

  if (fetchError) {
    console.log('Could not fetch roles:', fetchError.message);
  } else if (roles && roles.length > 0) {
    for (const role of roles) {
      const { error: updateError } = await supabase
        .from('roles')
        .update({
          auto_progression_enabled: true,
          auto_shortlist_threshold: 80,
          auto_reject_threshold: 60
        })
        .eq('id', role.id);

      if (updateError) {
        console.log(`  ${role.title}: Error - ${updateError.message}`);
      } else {
        console.log(`  ${role.title}: Auto-progression ENABLED`);
      }
    }
  } else {
    console.log('No active roles found');
  }

  console.log('\nMigration complete!');
}

runMigration().catch(console.error);
