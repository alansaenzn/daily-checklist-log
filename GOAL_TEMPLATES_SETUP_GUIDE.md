# Goal Templates: Setup Guide

## Problem
The `/templates` page returns error: `PGRST205 - Could not find the table 'public.goal_templates'`

This means the database migrations haven't been applied yet.

## Solution: Apply Migrations

### Option 1: Supabase Dashboard (Fastest)

1. **Go to Supabase Dashboard**
   - URL: https://supabase.com/dashboard
   - Project: checklist-log

2. **Access SQL Editor**
   - Left sidebar → SQL Editor
   - Click "New query"

3. **Copy and paste Migration SQL**
   - Open: `supabase/migrations/create_goal_templates.sql`
   - Paste entire content into SQL Editor
   - Click "Run"
   - You should see: "All queries executed successfully"

4. **Copy and paste Seed Data SQL**
   - Open: `supabase/seed/goal_templates.sql`
   - Paste entire content into SQL Editor
   - Click "Run"
   - You should see: "All queries executed successfully"

5. **Verify**
   - Go to Table Editor in left sidebar
   - You should see `goal_templates` and `goal_template_tasks` tables
   - `goal_templates` should have 5 rows (example templates)

### Option 2: CLI (If installed)

```bash
# Install Supabase CLI if not present
npm install -g supabase

# Link project
supabase link --project-ref eomhgxxtcwnoniblvkod

# Apply migrations
supabase migration up

# Seed data
supabase seed run
```

### Option 3: Using Node.js

```bash
# Set environment variables
export NEXT_PUBLIC_SUPABASE_URL=https://eomhgxxtcwnoniblvkod.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>

# Run migration script (coming soon)
node scripts/migrate.js
```

## After Migration: RLS Policies

Once tables are created, you should set up Row Level Security (RLS) policies to:
- Allow SELECT of system templates (is_system = true) for all authenticated users
- Allow SELECT of user-created templates only by their creator
- Allow SELECT of template tasks for accessible templates

### Setting Up RLS Policies via SQL Editor

```sql
-- Enable RLS on goal_templates
ALTER TABLE goal_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view system templates
CREATE POLICY "Users can view system templates"
  ON goal_templates
  FOR SELECT
  USING (is_system = true OR auth.uid() = created_by);

-- Enable RLS on goal_template_tasks
ALTER TABLE goal_template_tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view tasks from accessible templates
CREATE POLICY "Users can view tasks from accessible templates"
  ON goal_template_tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM goal_templates gt
      WHERE gt.id = goal_template_id
      AND (gt.is_system = true OR gt.created_by = auth.uid())
    )
  );
```

## Testing

After migrations:

1. **Restart dev server**
   ```bash
   npm run dev
   ```

2. **Visit /templates**
   - Should show 5 goal template cards
   - No console errors (check for PGRST205)

3. **Try applying a template**
   - Click "Apply" on a template
   - You should see 5 new recurring tasks in /tasks

## Troubleshooting

### Error: "PGRST205" still appears
- Table doesn't exist yet
- Run migration SQL again via Supabase Dashboard

### Error: "relation 'goal_templates' does not exist"
- Same as above - need to run migration

### Error: "Permission denied" or "new row violates RLS policy"
- RLS policies not set up yet
- Run the RLS policy SQL above via Supabase Dashboard

### Data appears empty even after migration
- Seed data wasn't applied
- Run the `supabase/seed/goal_templates.sql` SQL via Supabase Dashboard

## Files for Reference

- Migration: `supabase/migrations/create_goal_templates.sql`
- Seed data: `supabase/seed/goal_templates.sql`
- Schema docs: `GOAL_TEMPLATES_DATABASE_SCHEMA.md`
