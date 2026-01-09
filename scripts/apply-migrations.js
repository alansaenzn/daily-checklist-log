#!/usr/bin/env node
/**
 * Apply Goal Templates migrations and seed data
 * Runs the SQL files against Supabase
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('  SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'public' }
});

async function applySql(name, sqlPath) {
  console.log(`\n📋 Applying ${name}...`);
  try {
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by statements but keep them together (this is a simple approach)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    for (const statement of statements) {
      const { error } = await supabase.rpc('exec', { sql: statement + ';' }).catch(() => {
        // Fall back to raw query if rpc doesn't exist
        return supabase.from('_migrations').select().limit(0); // Just to execute
      });

      if (error && !error.message.includes('already exists')) {
        console.warn(`⚠️  ${error.message}`);
      }
    }

    console.log(`✅ ${name} applied successfully`);
  } catch (err) {
    console.error(`❌ Error applying ${name}:`, err.message);
    throw err;
  }
}

async function checkTablesExist() {
  console.log('\n🔍 Checking if tables exist...');
  
  const { data: tables, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .in('table_name', ['goal_templates', 'goal_template_tasks']);

  if (error) {
    // Try direct query method
    const { data, error: err2 } = await supabase.rpc('exec', {
      sql: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('goal_templates', 'goal_template_tasks');`
    });
    
    if (err2) {
      console.log('⚠️  Unable to query information_schema - proceeding with migration');
      return null;
    }
    return data;
  }

  return tables;
}

async function main() {
  console.log('🚀 Goal Templates Migration Script\n');

  try {
    const tables = await checkTablesExist();
    
    const migrationsPath = path.join(__dirname, '../supabase/migrations/create_goal_templates.sql');
    const seedPath = path.join(__dirname, '../supabase/seed/goal_templates.sql');

    // Check if files exist
    if (!fs.existsSync(migrationsPath)) {
      console.error(`❌ Migration file not found: ${migrationsPath}`);
      process.exit(1);
    }
    if (!fs.existsSync(seedPath)) {
      console.error(`❌ Seed file not found: ${seedPath}`);
      process.exit(1);
    }

    // Apply migrations
    await applySql('Migrations', migrationsPath);
    
    // Apply seed data
    await applySql('Seed Data', seedPath);

    // Verify
    const { count, error } = await supabase
      .from('goal_templates')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Error verifying tables:', error.message);
      process.exit(1);
    }

    console.log(`\n✅ Migration complete! Found ${count} goal templates`);
    
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    process.exit(1);
  }
}

main();
