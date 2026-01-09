# Extended Task Fields Migration

## Overview
This migration adds organization fields to the `task_templates` table.

## New Fields
All fields are optional and nullable:

- `notes` (TEXT) - Additional notes/description for the task
- `url` (TEXT) - Optional URL associated with the task
- `due_date` (DATE) - Optional due date (YYYY-MM-DD)
- `due_time` (TIME) - Optional due time (HH:MM:SS)
- `list_name` (TEXT) - Optional list/project name for organizing tasks
- `details` (TEXT) - Optional additional details or context

## Applying the Migration

### Option 1: Supabase SQL Editor (Recommended)
1. Open the Supabase Dashboard SQL Editor
2. Copy the contents of `supabase/migrations/add_task_template_extended_fields.sql`
3. Paste and execute in the SQL Editor

### Option 2: Supabase CLI
```bash
supabase db push
```

### Option 3: Manual SQL Execution
```sql
-- Add Apple Reminders-style organization fields to task_templates
ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS due_time TIME;
ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS list_name TEXT;
ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS details TEXT;

-- Add URL validation constraint
ALTER TABLE task_templates ADD CONSTRAINT task_templates_url_format 
  CHECK (url IS NULL OR url ~* '^https?://');

-- Indexes for queries by due date and list
CREATE INDEX IF NOT EXISTS idx_task_templates_due_date ON task_templates(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_templates_list_name ON task_templates(list_name) WHERE list_name IS NOT NULL;
```

## Code Changes

### Updated Files
1. **src/lib/task-types.ts** - Added optional fields to `TaskTemplate` interface
2. **src/app/actions/tasks.ts** - Updated `createTaskTemplate` and `updateTaskTemplate` to handle new fields
3. **src/app/tasks/TaskForm.tsx** - Added collapsible "Advanced Options" section with new field inputs
4. **src/app/tasks/TaskRow.tsx** - Added inline editing for extended fields with collapsible "Details" section
5. **src/app/tasks/page.tsx** - Updated query and props to include new fields

### UI Changes
- **Task Creation Form**: Collapsible "Advanced Options" section at the bottom
- **Task Editing**: Collapsible "Details" section when editing a task
- **Visual Indicator**: Blue dot (•) next to category when extended fields are present
- **Layout**: Existing UI layout unchanged, fields are hidden by default

## Backward Compatibility
- All new fields are optional (nullable)
- Existing tasks work without any changes
- No data migration needed
- Forms work with or without the new fields

## Testing
1. Create a new task with extended fields
2. Edit an existing task and add extended fields
3. Verify extended fields persist after page reload
4. Ensure existing tasks still work without extended fields

## Rollback
If needed, the migration can be rolled back:

```sql
ALTER TABLE task_templates DROP COLUMN IF EXISTS notes;
ALTER TABLE task_templates DROP COLUMN IF EXISTS url;
ALTER TABLE task_templates DROP COLUMN IF EXISTS due_date;
ALTER TABLE task_templates DROP COLUMN IF EXISTS due_time;
ALTER TABLE task_templates DROP COLUMN IF EXISTS list_name;
ALTER TABLE task_templates DROP COLUMN IF EXISTS details;
DROP INDEX IF EXISTS idx_task_templates_due_date;
DROP INDEX IF EXISTS idx_task_templates_list_name;
```
