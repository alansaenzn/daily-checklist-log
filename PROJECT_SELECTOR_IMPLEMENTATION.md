# Project Selector Implementation

## Overview
Successfully replaced the free-text "List / Project" field with a dropdown selector backed by the `projects` table.

## Files Created

### 1. `/src/components/ProjectSelector.tsx`
- Client component with dropdown selector
- Options: "Inbox" (no project), existing projects, "+ Create new project"
- Inline project creation form with cancel option
- Fetches projects from API endpoint
- Mobile-friendly styling

### 2. `/src/app/api/projects/route.ts`
- GET endpoint to fetch user's projects
- Returns projects sorted by creation date (newest first)
- Authenticated via Supabase auth

## Files Modified

### 1. `/src/app/tasks/TaskForm.tsx`
- Replaced text input with `ProjectSelector` component
- Added `projectId` state (empty string = Inbox)
- Sends `project_id` in form submission
- Resets project selection on form reset

### 2. `/src/app/tasks/TaskRow.tsx`
- Added `project_id` to Task interface
- Added `projectId` state for editing
- Replaced list_name input with `ProjectSelector` in edit mode
- Includes `project_id` in update calls
- Added proper label for Project field

### 3. `/src/app/actions/tasks.ts`
- Added `project_id` extraction from FormData
- Included `project_id` in task creation (createTaskTemplate)
- Added `project_id` to updateTaskTemplate interface

### 4. `/src/app/tasks/page.tsx`
- Added `project_id` to SELECT query for task templates
- Now fetches project assignments for display

## Features Implemented

✅ **Dropdown Selector**
- "Inbox" option (no project)
- List of user's projects
- "+ Create new project" option

✅ **Inline Project Creation**
- Click "+ Create new project"
- Shows input field with Add/Cancel buttons
- Creates project and auto-selects it
- Returns to dropdown after creation

✅ **Task Creation**
- Select project when creating task
- Defaults to "Inbox" (no project)
- Saved with `project_id` foreign key

✅ **Task Editing**
- Project selector appears in Advanced Options
- Can change project assignment
- Can set to "Inbox" to remove project

✅ **Data Integrity**
- Uses existing `projects` table
- Foreign key relationship: `task_templates.project_id → projects.id`
- NULL = Inbox (no project)
- ON DELETE SET NULL (if project deleted, tasks go to Inbox)

## UI/UX Details

- **Mobile-friendly**: Full-width inputs, touch-friendly spacing
- **Dark mode**: Consistent with existing form styling
- **Non-intrusive**: In Advanced Options section
- **Calm design**: Matches existing UI patterns
- **Error handling**: Shows error messages for failed project creation

## Database Schema

Already in place from previous migration:
```sql
-- projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  ...
);

-- Foreign key in task_templates
ALTER TABLE task_templates 
ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
```

## Testing Checklist

1. ✅ Navigate to Tasks page
2. ✅ Open Advanced Options
3. ✅ See "Project" dropdown with "Inbox" selected
4. ✅ Select "+ Create new project"
5. ✅ Enter project name and click Add
6. ✅ Project created and auto-selected
7. ✅ Submit task form
8. ✅ Task saved with project_id
9. ✅ Edit existing task
10. ✅ Change project assignment
11. ✅ Project saved on update

## Notes

- Preserved `list_name` field for backward compatibility (not removed from schema)
- Category logic unchanged
- Existing tasks without projects work correctly (NULL = Inbox)
- No external libraries added (pure React hooks)
