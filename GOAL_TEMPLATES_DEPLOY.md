# Goal Templates: Quick Deploy Guide

## Current Status ❌
- Tables: Not created yet
- Error: `PGRST205 - Could not find the table 'public.goal_templates'`

## Step 1: Apply Database Schema (2 min)

Go to **Supabase Dashboard** → SQL Editor:
```
https://supabase.com/dashboard/project/eomhgxxtcwnoniblvkod/sql/new
```

### Step 1a: Create Tables
Copy **entire content** from: `supabase/migrations/create_goal_templates.sql`
Paste into SQL editor → Click **Run**

Expected output: `Query executed successfully`

### Step 1b: Seed Example Data
Copy **entire content** from: `supabase/seed/goal_templates.sql`
Paste into SQL editor → Click **Run**

Expected output: `Query executed successfully`

## Step 2: Set Up RLS Policies (1 min)

In same Supabase SQL Editor, run this SQL:

```sql
-- Enable RLS on goal_templates table
ALTER TABLE goal_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can select system templates or their own templates
CREATE POLICY "Users can select system and own templates"
  ON goal_templates
  FOR SELECT
  USING (is_system = true OR auth.uid() = created_by);

-- Enable RLS on goal_template_tasks table
ALTER TABLE goal_template_tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can select tasks from accessible templates
CREATE POLICY "Users can select tasks from accessible templates"
  ON goal_template_tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM goal_templates
      WHERE goal_templates.id = goal_template_tasks.goal_template_id
      AND (goal_templates.is_system = true OR goal_templates.created_by = auth.uid())
    )
  );
```

Click **Run** → Expected: `Query executed successfully`

## Step 3: Verify & Test (1 min)

Run checker script:
```bash
node scripts/check-goal-templates.js
```

Expected output:
```
✓ goal_templates table EXISTS
✓ Found 5 templates
```

Restart dev server:
```bash
npm run dev
```

Visit: http://localhost:3000/templates
- You should see **5 goal template cards**
- No console errors
- Click "Apply" to add templates to your tasks

## Troubleshooting

| Error | Solution |
|-------|----------|
| `PGRST205: Could not find the table` | Run migration SQL in step 1a |
| `relation 'goal_templates' does not exist` | Same as above |
| Templates page loads but shows empty | Run seed data SQL in step 1b |
| Can't apply template / Permission denied | Run RLS policy SQL in step 2 |
| `/templates` still shows empty after everything | Check RLS policies - run the policy SQL again |

## File Locations

| What | Where |
|------|-------|
| Schema migration | `supabase/migrations/create_goal_templates.sql` |
| Example data | `supabase/seed/goal_templates.sql` |
| Error logging improvements | `src/app/templates/page.tsx` |
| Server actions | `src/app/actions/goal-templates.ts` |
| Detailed setup guide | `GOAL_TEMPLATES_SETUP_GUIDE.md` |

## What Happens Next

1. **Database Setup** (Done via SQL above)
   - Creates 2 new tables: `goal_templates` & `goal_template_tasks`
   - Adds 2 columns to `task_templates` table for reference tracking

2. **RLS Policies** (Done via SQL above)
   - System templates visible to all users
   - User templates only visible to creator
   - Tasks only visible for accessible templates

3. **Existing Code** (Already implemented)
   - Enhanced error logging in `page.tsx` and `goal-templates.ts`
   - Server actions to fetch and apply templates
   - React components for browsing and previewing
   - Navigation integration (Templates link in navbar)

4. **Try It Out**
   - Browse templates at `/templates`
   - Click "Apply" to add them to your daily tasks
   - View applied tasks at `/tasks`

---

**Total Setup Time: ~5 minutes**
