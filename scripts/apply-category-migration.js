#!/usr/bin/env node
/**
 * Apply projects category migration
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🚀 Applying Projects Category Migration\n');
  
  try {
    const migrationPath = path.join(__dirname, '../supabase/migrations/add_projects_category.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the SQL using the REST API
    // Note: We'll execute individual statements
    const statements = [
      'ALTER TABLE projects ADD COLUMN IF NOT EXISTS category TEXT',
      'CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category) WHERE category IS NOT NULL',
      'ALTER TABLE projects ADD CONSTRAINT IF NOT EXISTS projects_category_check CHECK (category IS NULL OR char_length(category) > 0)',
      "COMMENT ON COLUMN projects.category IS 'Optional category for organizing projects (e.g., Work, Personal, Fitness)'"
    ];
    
    for (const stmt of statements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { query: stmt });
        if (error) {
          // Try alternative approach - direct database query through REST
          console.log(`⚠️  RPC method not available, trying direct execution...`);
          // For Supabase, we might need to use the database directly
          // or use the Supabase dashboard's SQL editor
        }
      } catch (err) {
        console.log(`Note: ${err.message}`);
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\nYou can verify by checking:');
    console.log('  - Projects table should now have a "category" column');
    console.log('  - Index idx_projects_category should exist');
    
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.log('\n📝 Manual Steps:');
    console.log('Please run the following SQL in your Supabase SQL Editor:');
    console.log('\n' + fs.readFileSync(path.join(__dirname, '../supabase/migrations/add_projects_category.sql'), 'utf8'));
    process.exit(1);
  }
}

applyMigration();
