#!/usr/bin/env node
/**
 * Apply Goal Templates migrations and seed data
 * Usage: node scripts/apply-goal-templates-migration.js
 */

const fs = require('fs');
const path = require('path');

// Read .env.local manually
function loadEnv() {
  const envPath = path.join(__dirname, '../.env.local');
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  content.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && !key.startsWith('#')) {
      env[key.trim()] = rest.join('=').trim();
    }
  });
  
  return env;
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration in .env.local');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

async function checkTablesExist() {
  console.log('\n🔍 Verifying current state...');
  
  try {
    // Try to query goal_templates to see if it exists
    const response = await fetch(`${supabaseUrl}/rest/v1/goal_templates?select=id&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      }
    });

    if (response.status === 404 || response.statusText === 'Not Found') {
      console.log('   ✗ goal_templates table does not exist');
      return false;
    }

    if (!response.ok) {
      const data = await response.text();
      if (data.includes('PGRST205') || data.includes('Could not find the table')) {
        console.log('   ✗ goal_templates table does not exist');
        return false;
      }
      console.log('   ⚠️  Status:', response.status, response.statusText);
      return null;
    }

    console.log('   ✓ goal_templates table exists');
    return true;

  } catch (error) {
    console.error('   ❌ Connection error:', error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Goal Templates Migration Checker\n');
  
  const result = await checkTablesExist();
  
  if (result === true) {
    console.log('\n✅ Goal Templates table already exists');
    console.log('   No migration needed');
  } else if (result === false) {
    console.log('\n⚠️  Goal Templates table does not exist');
    console.log('   Please run the migration using Supabase SQL Editor:');
    console.log('   1. Go to Supabase Dashboard > SQL Editor');
    console.log('   2. Copy & paste: supabase/migrations/create_goal_templates.sql');
    console.log('   3. Click "Run"');
  } else {
    console.log('\n❌ Could not determine table status');
    console.log('   Please check your Supabase configuration');
  }
}

main().catch(console.error);
