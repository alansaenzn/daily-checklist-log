#!/usr/bin/env node
/**
 * Apply extended fields migration using Supabase client
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🚀 Applying Extended Fields Migration using Supabase SQL Editor\n');
  console.log('📋 Migration file: supabase/migrations/add_task_template_extended_fields.sql\n');
  
  const migrationPath = path.join(__dirname, '../supabase/migrations/add_task_template_extended_fields.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('📝 SQL to execute:');
  console.log('─'.repeat(60));
  console.log(sql);
  console.log('─'.repeat(60));
  console.log('\n⚠️  This script requires the SQL to be executed manually in Supabase SQL Editor');
  console.log(`\n1. Go to: ${supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/')}/sql/new`);
  console.log('2. Copy the SQL from the file above');
  console.log('3. Paste and run it in the SQL Editor\n');
  console.log('Alternative: The migration will be applied automatically when deploying to production\n');
}

main().catch(console.error);
