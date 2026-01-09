#!/usr/bin/env node
/**
 * Check which SQL migrations from supabase/migrations have been applied
 * Uses Supabase REST with anon or service key to probe table/column existence.
 */

const path = require('path');
const fs = require('fs');

// Load env if available (and if dotenv is installed)
const envLocalPath = path.join(__dirname, '../.env.local');
let dotenvLoaded = false;
try {
  if (fs.existsSync(envLocalPath)) {
    require('dotenv').config({ path: envLocalPath });
  } else {
    require('dotenv').config();
  }
  dotenvLoaded = true;
} catch (_) {
  // dotenv not installed; skip silently
}

// Fallback: manually parse .env.local if dotenv didn't load
if (!dotenvLoaded && fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf8');
  for (const line of content.split('\n')) {
    if (!line || line.trim().startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = val;
    }
  }
}

// CLI args support: --url=... --key=...
const argv = process.argv.slice(2).reduce((acc, arg) => {
  const m = arg.match(/^--([^=]+)=(.*)$/);
  if (m) acc[m[1]] = m[2];
  return acc;
}, {});

const SUPABASE_URL = argv.url || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = argv.key || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase config. Provide --url and --key or set NEXT_PUBLIC_SUPABASE_URL and a key env.');
  process.exit(1);
}

async function restGet(relPath) {
  const url = new URL(SUPABASE_URL);
  const endpoint = `https://${url.hostname}/rest/v1${relPath}`;
  const res = await fetch(endpoint, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: 'application/json',
    },
  });
  let bodyText = await res.text();
  let data = null;
  try {
    data = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    data = bodyText;
  }
  return { status: res.status, ok: res.ok, data };
}

async function tableExists(table) {
  // Probe by selecting a cheap column name
  const { ok, status, data } = await restGet(`/${encodeURIComponent(table)}?select=*&limit=0`);
  if (ok) return true;
  // 406 Not Acceptable is also returned if no select header, we provide select param
  if (status === 404 || status === 400) return false;
  // If PostgREST returns error object, inspect message
  const msg = typeof data === 'string' ? data : (data && (data.message || data.error || JSON.stringify(data)));
  if (msg && /not found|does not exist|PGRST205/i.test(msg)) return false;
  return false;
}

async function columnExists(table, column) {
  // Try selecting only that column
  const { ok, status, data } = await restGet(`/${encodeURIComponent(table)}?select=${encodeURIComponent(column)}&limit=0`);
  if (ok) return true;
  const msg = typeof data === 'string' ? data : (data && (data.message || data.error || JSON.stringify(data)));
  if (status === 400 && msg && /column .* does not exist|unknown column|PGRST2/i.test(msg)) return false;
  if (status === 404) return false;
  return false;
}

async function checkRlsPoliciesForGoalTemplates() {
  // Best-effort: if we can select system templates without auth context, assume policies exist.
  // This is imperfect and may return empty if no seed applied.
  const { ok, status } = await restGet('/goal_templates?select=id,is_system&is_system=eq.true&limit=1');
  // If 200 OK, policies likely allow select of system templates.
  if (ok) return { applied: true, note: 'Selectable system templates via REST (policies likely present).' };
  // If 401/403, policies may be missing or RLS disabled; we cannot confirm via REST.
  if (status === 401 || status === 403) return { applied: false, note: 'Unauthorized selecting goal_templates; RLS/policies may not be in place.' };
  return { applied: false, note: 'Unable to verify via REST' };
}

async function main() {
  console.log('🔎 Checking Supabase migrations status');

  const results = [];

  // Ensure base table likely exists for column checks
  const hasTaskTemplates = await tableExists('task_templates');

  // 1) create_projects_table.sql
  const projectsTable = await tableExists('projects');
  results.push({ name: 'create_projects_table.sql', applied: projectsTable, detail: projectsTable ? 'projects table exists' : 'projects table missing' });

  // add_projects_description.sql
  let projectsDesc = false;
  if (projectsTable) projectsDesc = await columnExists('projects', 'description');
  results.push({ name: 'add_projects_description.sql', applied: projectsDesc, detail: projectsDesc ? 'projects.description exists' : 'projects.description missing' });

  // 2) create_user_settings_table.sql
  const userSettings = await tableExists('user_settings');
  results.push({ name: 'create_user_settings_table.sql', applied: userSettings, detail: userSettings ? 'user_settings table exists' : 'user_settings table missing' });

  // 3) create_goal_templates.sql
  const goalTemplates = await tableExists('goal_templates');
  const goalTemplateTasks = await tableExists('goal_template_tasks');
  const ttGoalTemplateId = hasTaskTemplates ? await columnExists('task_templates', 'goal_template_id') : false;
  results.push({ name: 'create_goal_templates.sql', applied: goalTemplates && goalTemplateTasks && ttGoalTemplateId, detail: `${goalTemplates?'✓':'✗'} goal_templates, ${goalTemplateTasks?'✓':'✗'} goal_template_tasks, ${ttGoalTemplateId?'✓':'✗'} task_templates.goal_template_id` });

  // 4) rls_policies_goal_templates.sql (best-effort)
  const rlsCheck = await checkRlsPoliciesForGoalTemplates();
  results.push({ name: 'rls_policies_goal_templates.sql', applied: rlsCheck.applied, detail: rlsCheck.note });

  // 5) add_priority_field.sql
  const priorityCol = hasTaskTemplates ? await columnExists('task_templates', 'priority') : false;
  results.push({ name: 'add_priority_field.sql', applied: priorityCol, detail: priorityCol ? 'task_templates.priority exists' : 'task_templates.priority missing' });

  // 6) add_task_template_extended_fields.sql
  const extCols = hasTaskTemplates ? await Promise.all([
    columnExists('task_templates', 'notes'),
    columnExists('task_templates', 'url'),
    columnExists('task_templates', 'due_date'),
    columnExists('task_templates', 'due_time'),
    columnExists('task_templates', 'list_name'),
    columnExists('task_templates', 'details'),
  ]) : [false,false,false,false,false,false];
  const extApplied = extCols.every(Boolean);
  results.push({ name: 'add_task_template_extended_fields.sql', applied: extApplied, detail: `notes:${extCols[0]?'✓':'✗'} url:${extCols[1]?'✓':'✗'} due_date:${extCols[2]?'✓':'✗'} due_time:${extCols[3]?'✓':'✗'} list_name:${extCols[4]?'✓':'✗'} details:${extCols[5]?'✓':'✗'}` });

  // 7) add_task_template_difficulty.sql
  const difficultyCol = hasTaskTemplates ? await columnExists('task_templates', 'difficulty') : false;
  results.push({ name: 'add_task_template_difficulty.sql', applied: difficultyCol, detail: difficultyCol ? 'task_templates.difficulty exists' : 'task_templates.difficulty missing' });

  // 8) add_task_template_recurrence_interval.sql
  const recurInterval = hasTaskTemplates ? await columnExists('task_templates', 'recurrence_interval_days') : false;
  results.push({ name: 'add_task_template_recurrence_interval.sql', applied: recurInterval, detail: recurInterval ? 'task_templates.recurrence_interval_days exists' : 'task_templates.recurrence_interval_days missing' });

  // 9) add_task_template_recurrence_days_mask.sql
  const recurMask = hasTaskTemplates ? await columnExists('task_templates', 'recurrence_days_mask') : false;
  results.push({ name: 'add_task_template_recurrence_days_mask.sql', applied: recurMask, detail: recurMask ? 'task_templates.recurrence_days_mask exists' : 'task_templates.recurrence_days_mask missing' });

  const pending = results.filter(r => !r.applied).map(r => r.name);

  console.log('\nResults:');
  for (const r of results) {
    console.log(` - ${r.applied ? '✅' : '❌'} ${r.name} — ${r.detail}`);
  }
  console.log('\n\nPending migrations:');
  if (pending.length === 0) {
    console.log(' - None. All detected migrations look applied.');
  } else {
    pending.forEach(n => console.log(` - ${n}`));
  }
}

main().catch(err => {
  console.error('❌ Check failed:', err.message);
  process.exit(1);
});
