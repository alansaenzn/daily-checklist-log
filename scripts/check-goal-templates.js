#!/usr/bin/env node
/**
 * Check if Goal Templates tables exist in Supabase
 * Usage: node scripts/check-goal-templates.js
 */

const fs = require('fs');
const path = require('path');

// Read .env.local manually
function loadEnv() {
  const envPath = path.join(__dirname, '../.env.local');
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    
    content.split('\n').forEach(line => {
      const idx = line.indexOf('=');
      if (idx > 0) {
        const key = line.substring(0, idx).trim();
        const value = line.substring(idx + 1).trim();
        if (key && !key.startsWith('#')) {
          env[key] = value;
        }
      }
    });
    
    return env;
  } catch (e) {
    console.error('Error reading .env.local:', e.message);
    return {};
  }
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
  console.log('\n🔍 Checking if goal_templates table exists...\n');
  
  try {
    // Try to query goal_templates to see if it exists
    const response = await fetch(`${supabaseUrl}/rest/v1/goal_templates?select=id&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      }
    });

    const responseText = await response.text();

    if (responseText.includes('PGRST205') || responseText.includes('Could not find the table')) {
      console.log('   ✗ goal_templates table does NOT exist');
      return false;
    }

    if (!response.ok) {
      console.log('   ⚠️  Response status:', response.status);
      console.log('   Response:', responseText.substring(0, 200));
      return null;
    }

    const data = JSON.parse(responseText);
    if (Array.isArray(data)) {
      console.log(`   ✓ goal_templates table EXISTS`);
      console.log(`   ✓ Found ${data.length} templates`);
      return true;
    }

    return null;

  } catch (error) {
    console.error('   ❌ Connection error:', error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Goal Templates Table Checker\n');
  console.log(`Project URL: ${supabaseUrl}`);
  
  const exists = await checkTablesExist();

  if (exists === true) {
    console.log('\n✅ Migration already applied!');
    console.log('   Restart dev server: npm run dev');
    console.log('   Then visit: http://localhost:3000/templates');
    process.exit(0);
  }

  if (exists === false) {
    console.log('\n❌ Migrations need to be applied\n');
    
    const migrationPath = path.relative(process.cwd(), 
      path.join(__dirname, '../supabase/migrations/create_goal_templates.sql'));
    const seedPath = path.relative(process.cwd(),
      path.join(__dirname, '../supabase/seed/goal_templates.sql'));

    console.log('To apply migrations via Supabase Dashboard:');
    console.log('');
    console.log('1. Go to: https://supabase.com/dashboard');
    console.log('2. Select project: checklist-log');
    console.log('3. Go to: SQL Editor → New query');
    console.log(`4. Copy everything from: ${migrationPath}`);
    console.log('5. Paste into SQL editor and click "Run"');
    console.log('');
    console.log('6. Create another new query');
    console.log(`7. Copy everything from: ${seedPath}`);
    console.log('8. Paste into SQL editor and click "Run"');
    console.log('');
    console.log('9. Restart dev server: npm run dev');
    console.log('10. Visit: http://localhost:3000/templates');
    console.log('');
    console.log('For detailed setup guide, see: GOAL_TEMPLATES_SETUP_GUIDE.md');
    process.exit(1);
  }

  console.log('\n⚠️  Unable to determine database state');
  console.log('Please check your Supabase connection and try again');
  process.exit(1);
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
