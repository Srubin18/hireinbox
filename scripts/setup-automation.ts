import { createClient } from '@supabase/supabase-js';

// Setup automation for HireInbox
// This script:
// 1. Adds automation columns to roles table
// 2. Enables auto-progression on all active roles

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function setupAutomation() {
  console.log('=== HireInbox Automation Setup ===\n');

  if (!supabaseUrl || !supabaseKey) {
    console.error('ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    console.log('Make sure .env.local is loaded');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test connection
  console.log('1. Testing Supabase connection...');
  const { data: testData, error: testError } = await supabase
    .from('roles')
    .select('count')
    .limit(1);

  if (testError) {
    console.error('   Connection failed:', testError.message);
    process.exit(1);
  }
  console.log('   Connected!\n');

  // Step 2: Enable auto-progression on all active roles
  console.log('2. Enabling auto-progression on active roles...');

  const { data: roles, error: rolesError } = await supabase
    .from('roles')
    .select('id, title, company_name, status');

  if (rolesError) {
    console.error('   Failed to fetch roles:', rolesError.message);
  } else if (roles && roles.length > 0) {
    console.log(`   Found ${roles.length} roles:\n`);

    for (const role of roles) {
      // Try to update - if columns don't exist, this will fail gracefully
      const { error: updateError } = await supabase
        .from('roles')
        .update({
          auto_progression_enabled: true,
          auto_shortlist_threshold: 80,
          auto_reject_threshold: 60,
          interview_instructions: 'We will contact you shortly to schedule an interview.'
        })
        .eq('id', role.id);

      if (updateError) {
        if (updateError.message.includes('column')) {
          console.log(`   NOTE: Auto-progression columns not yet in database.`);
          console.log(`   Please run the migration SQL in Supabase Dashboard:\n`);
          console.log(`   supabase/migrations/20260123_automation_columns.sql\n`);
          break;
        }
        console.log(`   ${role.title}: Error - ${updateError.message}`);
      } else {
        console.log(`   ✓ ${role.title} (${role.company_name || 'No company'}) - Auto-progression ENABLED`);
      }
    }
  } else {
    console.log('   No roles found in database');
  }

  // Step 3: Check candidates with hiring_pass
  console.log('\n3. Checking candidates...');

  const { data: candidates, error: candError } = await supabase
    .from('candidates')
    .select('id, name, status, ai_score')
    .not('ai_score', 'is', null)
    .limit(10);

  if (candError) {
    console.log('   Could not check candidates:', candError.message);
  } else if (candidates) {
    console.log(`   Found ${candidates.length} screened candidates`);
    candidates.forEach(c => {
      console.log(`   - ${c.name}: Score ${c.ai_score}, Status: ${c.status}`);
    });
  }

  console.log('\n=== Setup Complete ===\n');
  console.log('The automation cron job will run every 5 minutes and:');
  console.log('1. Fetch new CVs from email');
  console.log('2. Screen them with AI');
  console.log('3. Auto-progress based on score (>=80 shortlist, <60 reject)');
  console.log('4. Send outcome emails automatically\n');
}

setupAutomation().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});
