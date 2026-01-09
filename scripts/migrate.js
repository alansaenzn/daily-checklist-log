#!/usr/bin/env node
/**
 * Apply Goal Templates migrations and seed data
 * Uses Supabase SQL endpoint
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Parse URL
const url = new URL(supabaseUrl);
const projectId = url.hostname.split('.')[0];

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: url.hostname,
      port: 443,
      path: path,
      method: method,
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
        try {
          resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function applySqlViaRPC(sql, description) {
  console.log(`\n📋 ${description}...`);
  try {
    const response = await makeRequest('POST', '/rest/v1/rpc/exec', { sql });
    
    if (response.status >= 400) {
      console.error(`❌ ${description} failed:`, response.data);
      return false;
    }
    
    console.log(`✅ ${description} complete`);
    return true;
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Goal Templates Migration Script\n');

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

  try {
    const migrationSql = fs.readFileSync(migrationsPath, 'utf8');
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    // Apply migrations
    const migSuccess = await applySqlViaRPC(migrationSql, 'Applying migrations');
    if (!migSuccess) {
      console.log('\n⚠️  Note: Migration may have already been applied');
    }

    // Apply seed data
    const seedSuccess = await applySqlViaRPC(seedSql, 'Applying seed data');
    if (!seedSuccess) {
      console.log('\n⚠️  Note: Seed data may have already been applied');
    }

    console.log('\n✅ Done!');
    
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }
}

main();
