#!/usr/bin/env node
/**
 * Apply onboarding fields migration to profiles
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load env from .env.local if present
try {
  require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
} catch (_) {
  // dotenv may not be installed; rely on process env
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and a key (anon or service)');
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
  console.log('🚀 Applying Onboarding Fields Migration\n');

  const migrationPath = path.join(__dirname, '../supabase/migrations/add_onboarding_fields.sql');
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');
  const cleaned = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');

  const statements = cleaned
    .split(';')
    .map(s => s.trim())
    .filter(s => s);

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
      }
    }
  }

  console.log('\n✅ Onboarding migration complete!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
