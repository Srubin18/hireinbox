#!/usr/bin/env node

/**
 * Create Pilot User Script
 *
 * Usage: node scripts/create-pilot-user.js <email> <password>
 * Example: node scripts/create-pilot-user.js djchernick@gmail.com MyPassword123
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function createPilotUser(email, password) {
  // Validate inputs
  if (!email || !password) {
    console.error('\n❌ Error: Email and password are required');
    console.log('\nUsage: node scripts/create-pilot-user.js <email> <password>');
    console.log('Example: node scripts/create-pilot-user.js user@company.co.za SecurePass123\n');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('\n❌ Error: Password must be at least 6 characters\n');
    process.exit(1);
  }

  // Initialize Supabase Admin Client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('\n❌ Error: Missing Supabase credentials in .env.local');
    console.log('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY\n');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('\n🚀 Creating pilot user...\n');

  try {
    // Create user with Admin API
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        user_type: 'pilot_recruiter'
      }
    });

    if (createError) {
      console.error('❌ Error creating user:', createError.message);
      process.exit(1);
    }

    console.log('✅ User created successfully!\n');
    console.log('📋 User Details:');
    console.log('   ID:', user.user.id);
    console.log('   Email:', user.user.email);
    console.log('   Email Confirmed:', user.user.email_confirmed_at ? 'Yes' : 'No');
    console.log('   User Type:', user.user.user_metadata?.user_type);
    console.log('   Created At:', user.user.created_at);
    console.log('\n🔑 Login Credentials:');
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('   Login URL: http://localhost:3001/pilot');
    console.log('   Production URL: https://hireinbox.co.za/pilot');
    console.log('\n📧 Email Template for User:');
    console.log('   ─────────────────────────────────────────────────');
    console.log('   Subject: Your HireInbox Pilot Access\n');
    console.log('   Hi there,\n');
    console.log('   Welcome to the HireInbox pilot program!\n');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('   Login URL: https://hireinbox.co.za/pilot\n');
    console.log('   Need help? Contact simon@mafadi.co.za\n');
    console.log('   Best regards,');
    console.log('   The HireInbox Team');
    console.log('   ─────────────────────────────────────────────────\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

// Get email and password from command line args
const email = process.argv[2];
const password = process.argv[3];

createPilotUser(email, password);
