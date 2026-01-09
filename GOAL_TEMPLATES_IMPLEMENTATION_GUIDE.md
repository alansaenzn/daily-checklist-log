# Goal Templates Implementation Guide

## Quick Start

### 1. Deploy Database Schema

Run the SQL migration to create the new tables:

```bash
# Option A: Using Supabase CLI
supabase migration up

# Option B: Direct execution in Supabase dashboard
# Copy contents of supabase/migrations/create_goal_templates.sql
# Run in SQL Editor
```

This creates:
- `goal_templates` table
- `goal_template_tasks` table
- Indexes for performance
- Extended `task_templates` with optional columns

### 2. Seed Initial Templates

Run the seed data to populate example goal templates:

```bash
# Using Supabase CLI
supabase seed run

# Or manually execute in Supabase dashboard:
# Copy contents of supabase/seed/goal_templates.sql
```

This creates 5 system templates:
- Deep Work Session (Productivity)
- Skill Building (Training)
- Creative Flow (Creative)
- Daily Wellness (Health)
- Mindful Morning (Mindfulness)

### 3. Verify Installation

Access the templates page to confirm everything works:

```
http://localhost:3000/templates
```

You should see:
- All 5 templates listed
- Ability to filter by focus area
- Preview and Apply buttons functional
- Tasks appear in your daily checklist after applying

## Files Added/Modified

### New Files

```
src/
├── app/
│   ├── actions/goal-templates.ts           # Server actions for templates
│   └── templates/page.tsx                   # Templates page (MVP)
├── components/
│   ├── GoalTemplateCard.tsx                # Template card component
│   ├── GoalTemplatePreview.tsx             # Preview modal component
│   └── GoalTemplatesListView.tsx           # Main list view component

supabase/
├── migrations/create_goal_templates.sql    # Database schema
└── seed/goal_templates.sql                 # Example data
```

### Modified Files

```
src/
└── lib/task-types.ts                       # Added GoalTemplate types
```

### Documentation

```
GOAL_TEMPLATES_DOCUMENTATION.md             # Full feature documentation
```

## Architecture Overview

### Data Flow: Applying a Template

```
User visits /templates
    ↓
[GoalTemplatesPage] - Server fetches available templates
    ↓
[GoalTemplatesListView] - Client-side filtering & interaction
    ↓
User clicks "Preview"
    ↓
[getGoalTemplateWithTasks] - Fetch template + tasks server action
    ↓
[GoalTemplatePreview] - Display modal with all tasks
    ↓
User clicks "Apply"
    ↓
[applyGoalTemplate] - Server action copies tasks to task_templates
    ↓
Toast notification + modal closes
    ↓
Tasks now appear in daily checklist
```

### Independence After Creation

```
Goal Template Tasks     ──[COPIED AT APPLICATION TIME]──>   Task Templates (Live User Tasks)
(Blueprint)                                                  (Fully Editable)
- Immutable structure                                        - Can edit title, category
- Reference only                                            - Can toggle active/inactive
- Template continues existing                              - Can delete completely
                                                            - Can convert to one-off
                                                            - Can re-enable if archived

NO LINK BACK: Changes to task_template do not affect template
```

## Server Action Details

### `applyGoalTemplate(goalTemplateId: string)`

**What it does:**
1. Authenticates the user
2. Fetches the template with all its tasks
3. Creates new recurring task_templates with:
   - User's ID
   - Task title, category
   - `task_type: "recurring"`
   - `is_active: true`
   - Metadata fields: `goal_template_id`, `applied_from_template_name`
4. Returns success message with count

**Error Handling:**
- Not authenticated → throws "Not authenticated"
- Template not found → throws "Goal template not found"
- No tasks in template → throws "Template has no tasks to apply"
- Database error → throws with error message

**Idempotent?**
No. Applying the same template twice creates duplicate tasks. This is intentional—users may want to apply the same template multiple times for different purposes.

## Component Integration

### Minimal Integration (What You Get)

The feature is fully self-contained. To add it to your app:

1. **Add navigation link** to `/templates`:
   ```tsx
   <a href="/templates" className="...">Goal Templates</a>
   ```

2. **That's it!** The page handles everything internally.

### Extend It: Accessing Templates Elsewhere

Add a sidebar widget showing recent templates:

```tsx
// Example: In your daily checklist page
import { getGoalTemplates } from "@/app/actions/goal-templates";

export async function RecentTemplatesWidget() {
  const templates = await getGoalTemplates();
  return (
    <div className="...">
      {templates.slice(0, 3).map(t => (
        <Link key={t.id} href={`/templates?focus=${t.focus_area}`}>
          {t.name}
        </Link>
      ))}
    </div>
  );
}
```

## Customization Points

### Add More System Templates

Edit `supabase/seed/goal_templates.sql`:

```sql
INSERT INTO goal_templates (name, description, focus_area, is_system)
VALUES (
  'Your Template Name',
  'Your description',
  'YourFocusArea',  -- Must match GOAL_FOCUS_AREAS
  true
);

-- Then add tasks...
INSERT INTO goal_template_tasks (goal_template_id, title, ...)
```

### Modify UI Styling

All components use Tailwind CSS. Key classes to customize:

- Template cards: `GoalTemplateCard` → grid styling
- Preview modal: `GoalTemplatePreview` → modal size, colors
- Focus buttons: `GoalTemplatesListView` → button colors

### Change Default Task Type

In `applyGoalTemplate()`, change:
```typescript
task_type: "recurring" as const,  // ← Change to "one_off" for one-time tasks
```

### Add Validation

Expand validation in server actions:

```typescript
if (tasks.length > 10) {
  throw new Error("Template cannot have more than 10 tasks");
}

if (totalDuration > 120) {
  throw new Error("Template duration should not exceed 2 hours");
}
```

## Permissions & Access Control

### Who Can View Templates?
- All authenticated users see system templates (`is_system: true`)
- Users see their own created templates
- Cannot access other users' custom templates (authorization check in actions)

### Who Can Apply Templates?
- Any authenticated user can apply any visible template

### Who Can Create Templates?
- Currently requires direct database access or calling `createGoalTemplate` action
- Not exposed in UI (future feature)

### To Restrict Apply:
```typescript
// In applyGoalTemplate()
if (userData.user.email?.endsWith("@yourcompany.com")) {
  throw new Error("Feature not available");
}
```

## Testing Checklist

### Happy Path
- [ ] Visit `/templates`
- [ ] See all 5 system templates
- [ ] Filter by "Productivity" shows Deep Work Session
- [ ] Click "Preview" on Deep Work Session
- [ ] Modal shows 5 tasks with durations
- [ ] Click "Apply"
- [ ] Toast shows success message "Applied Deep Work Session with 5 tasks!"
- [ ] Visit today's checklist
- [ ] See 5 new active tasks
- [ ] Can toggle each task as complete

### Edge Cases
- [ ] Click Apply on empty search results
- [ ] Apply same template twice (should create duplicates)
- [ ] Edit applied task's title
- [ ] Delete applied task
- [ ] Deactivate applied task
- [ ] Apply template, then refresh page

### Error Cases
- [ ] Log out, visit `/templates` → redirects to `/login`
- [ ] Network error during apply → shows error toast
- [ ] Template no longer exists → shows error toast

### Mobile/Responsive
- [ ] Templates grid stacks on mobile
- [ ] Preview modal scrollable on small screens
- [ ] Buttons are touch-friendly (48px minimum)

## Common Issues & Solutions

### Issue: "Unauthorized" when applying template
**Cause:** User accessing another user's custom template
**Solution:** Only show templates user has access to in the list

### Issue: Duplicate tasks after applying template twice
**Expected behavior:** Templates are designed to be idempotent-optional. If users apply the same template twice, they get duplicate tasks (which they can then delete).
**To prevent:** Add a check in `applyGoalTemplate()`:
```typescript
// Check if tasks from this template already exist
const { data: existing } = await supabase
  .from("task_templates")
  .select("id")
  .eq("goal_template_id", goalTemplateId)
  .eq("user_id", userData.user.id);

if (existing?.length > 0) {
  throw new Error("You've already applied this template");
}
```

### Issue: Tasks created as "recurring" but I want "one_off"
**Solution:** Users can convert tasks after creation using the edit UI, or modify `applyGoalTemplate()` to use `"one_off"` as the default task_type.

## Performance Notes

- **Initial load**: Templates fetched server-side (fast)
- **Preview load**: Single query fetches template + tasks
- **Apply**: Bulk insert all tasks in one operation
- **No N+1**: List view requires only 1 query even with many templates

### Scaling Considerations

If you expect thousands of templates:
- Add `created_at DESC` sorting (already done)
- Paginate the list view
- Add search by name
- Cache popular templates

## Future Enhancement Ideas

1. **Template Ratings**: Users upvote favorite templates
   ```sql
   CREATE TABLE template_ratings (
     user_id UUID,
     template_id UUID,
     rating INT (1-5),
     UNIQUE(user_id, template_id)
   );
   ```

2. **Smart Recommendations**: "You might like this template based on your completed tasks"

3. **User Templates**: Allow users to save their favorite task combinations as templates
   ```typescript
   // Add UI button: "Save as template"
   await createGoalTemplate(...currentTasks);
   ```

4. **Time Blocks**: Group templates by time of day
   ```sql
   ADD COLUMN time_of_day TEXT ('morning', 'midday', 'evening');
   ```

5. **Analytics**: Track which templates have highest completion rates
   ```sql
   CREATE TABLE template_application_metrics (
     template_id UUID,
     applied_date DATE,
     completion_rate DECIMAL
   );
   ```

## Rollback Instructions

If you need to remove the feature:

```sql
-- Drop new tables
DROP TABLE goal_template_tasks CASCADE;
DROP TABLE goal_templates CASCADE;

-- Remove optional columns from task_templates
ALTER TABLE task_templates 
DROP COLUMN IF EXISTS goal_template_id,
DROP COLUMN IF EXISTS applied_from_template_name;
```

Then delete:
- `src/app/templates/`
- `src/components/GoalTemplate*.tsx`
- `src/app/actions/goal-templates.ts`
- Updated type definitions in `src/lib/task-types.ts`

## Support & Questions

See `GOAL_TEMPLATES_DOCUMENTATION.md` for:
- Complete API reference
- Database schema details
- Component API documentation
- TypeScript types
- Design principles

