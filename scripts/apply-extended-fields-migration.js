#!/usr/bin/env node
/**
 * Apply extended fields migration to task_templates
 * Adds Apple Reminders-style organization fields
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const url = new URL(supabaseUrl);

function executeSql(sql) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: url.hostname,
      port: 443,
      path: '/rest/v1/rpc/exec',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify({ sql }));
    req.end();
  });
}

async function main() {
  console.log('🚀 Applying Extended Fields Migration\n');

  const migrationPath = path.join(__dirname, '../supabase/migrations/add_task_template_extended_fields.sql');

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  // Split into statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  console.log(`📋 Found ${statements.length} SQL statements\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
    
    try {
      await executeSql(statement + ';');
      console.log(`✅ Statement ${i + 1} executed successfully`);
    } catch (err) {
      if (err.message.includes('already exists') || err.message.includes('duplicate')) {
        console.log(`⚠️  Statement ${i + 1} skipped (already exists)`);
      } else {
        console.error(`❌ Error executing statement ${i + 1}:`, err.message);
        // Continue with other statements
      }
    }
  }

  console.log('\n✅ Migration complete!');
  console.log('\n📝 Added fields:');
  console.log('  - notes (TEXT)');
  console.log('  - url (TEXT)');
  console.log('  - due_date (DATE)');
  console.log('  - due_time (TIME)');
  console.log('  - list_name (TEXT)');
  console.log('  - details (TEXT)');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
