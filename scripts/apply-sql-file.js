#!/usr/bin/env node
/**
 * Apply a SQL file to Supabase via the exec RPC
 * Usage: node scripts/apply-sql-file.js supabase/migrations/your_file.sql
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local if available.
try {
  require('dotenv').config({ path: '.env.local' });
} catch {
  // Fallback: basic parser for .env.local without dotenv
  const fs = require('fs');
  try {
    const rawEnv = fs.readFileSync('.env.local', 'utf8');
    rawEnv.split(/\r?\n/).forEach((line) => {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) return;
      const key = m[1];
      let value = m[2];
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    });
  } catch {}
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('  NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required');
  process.exit(1);
}

const url = new URL(supabaseUrl);

function execSql(sql) {
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
          resolve({ status: res.statusCode, data });
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
  const fileArg = process.argv[2];
  if (!fileArg) {
    console.error('Usage: node scripts/apply-sql-file.js <path-to-sql-file>');
    process.exit(1);
  }

  const sqlPath = path.resolve(process.cwd(), fileArg);
  if (!fs.existsSync(sqlPath)) {
    console.error('❌ SQL file not found:', sqlPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(sqlPath, 'utf8');
  const statements = raw
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  console.log(`📋 Applying ${statements.length} SQL statements from ${fileArg}`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i] + ';';
    try {
      await execSql(stmt);
      console.log(`✅ Statement ${i + 1}/${statements.length} applied`);
    } catch (err) {
      if (/(already exists|duplicate|does not exist)/i.test(err.message)) {
        console.warn(`⚠️  Statement ${i + 1} warning: ${err.message}`);
      } else {
        console.error(`❌ Statement ${i + 1} failed: ${err.message}`);
        process.exit(1);
      }
    }
  }

  console.log('✅ Done');
}

main();
