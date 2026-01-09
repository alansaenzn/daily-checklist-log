# Goal Templates Feature Documentation

## Overview

Goal Templates are momentum-focused task collections that users can apply to quickly populate their daily task system. They serve as blueprints, not prescriptions—tasks are fully editable after application.

## Key Concepts

### Goal Templates
- **Purpose**: Provide curated, pre-designed task sets organized by focus area
- **System Templates**: Built-in templates available to all users (e.g., "Deep Work", "Daily Wellness")
- **User Templates**: Custom templates created by power users for personal use
- **No Link Back**: After tasks are created, they're independent—editing a task doesn't affect the template

### Focus Areas
Goal templates are categorized by focus areas for easy discovery:
- **Productivity**: Deep work, focus sessions
- **Training**: Learning, skill building
- **Creative**: Art, writing, creative projects
- **Health**: Fitness, nutrition, wellbeing
- **Mindfulness**: Meditation, gratitude, reflection
- **Social**: Connection, relationships

### Template Tasks
- **Small & Achievable**: Designed for 5-15 minutes each to build momentum
- **Optional Tasks**: Some tasks marked as optional—no guilt if skipped
- **Editable After Apply**: Users can modify, delete, or repurpose tasks
- **Estimated Duration**: Helps set expectations without pressure

## Database Schema

### `goal_templates`
```sql
id UUID (PRIMARY KEY)
name TEXT NOT NULL
description TEXT
focus_area TEXT NOT NULL
created_by UUID (nullable - NULL for system templates)
is_system BOOLEAN
created_at TIMESTAMP
updated_at TIMESTAMP
```

### `goal_template_tasks`
```sql
id UUID (PRIMARY KEY)
goal_template_id UUID (FOREIGN KEY → goal_templates)
title TEXT NOT NULL
description TEXT
category TEXT
is_optional BOOLEAN (default: false)
estimated_duration_minutes INT
display_order INT
created_at TIMESTAMP
updated_at TIMESTAMP
```

### `task_templates` (extended)
Added optional columns to track the source template:
```sql
goal_template_id UUID (nullable reference)
applied_from_template_name TEXT (for UI context)
```

**Note**: These columns are for reference only. There is NO foreign key constraint binding applied tasks back to the template. This ensures tasks remain independent and editable.

## Server Actions

### `getGoalTemplates(focusArea?: string)`
Fetches all available templates (system + user-created).

```typescript
const templates = await getGoalTemplates();
const productivityOnly = await getGoalTemplates("Productivity");
```

### `getGoalTemplateWithTasks(templateId: string)`
Fetches a single template with all its tasks (needed for preview).

```typescript
const template = await getGoalTemplateWithTasks(templateId);
// Returns: { ...GoalTemplate, tasks: GoalTemplateTask[] }
```

### `applyGoalTemplate(goalTemplateId: string)`
Creates new recurring task_templates from a goal template for the current user.

**Behavior**:
- Copies all tasks from the goal template
- Creates them as `task_type: "recurring"` and `is_active: true`
- Stores metadata (`goal_template_id`, `applied_from_template_name`)
- Does NOT create any link back to the template

**Return Value**:
```typescript
{
  success: true,
  templatesCreated: 5,
  templateName: "Deep Work Session"
}
```

### `createGoalTemplate(name, description, focusArea, tasks)`
Allows power users to create custom goal templates.

## UI Components

### `GoalTemplateCard`
Individual template card showing:
- Template name and description
- Focus area badge
- Task count
- Preview and Apply buttons

### `GoalTemplatePreview`
Modal dialog showing:
- Full template details
- All tasks with metadata (duration, optional indicator)
- Total estimated time
- Apply button with loading state
- Helpful tip about task editability

### `GoalTemplatesListView`
Main page component featuring:
- Focus area filter buttons
- Grid of template cards
- Toast notifications for apply success/error
- Responsive design

### `GoalTemplatesPage`
Server-rendered page at `/templates`
- Fetches templates server-side for initial load
- Uses `GoalTemplatesListView` for interactivity
- Requires authentication

## Usage Flow

### For Users: Applying a Template

1. **Navigate** to `/templates`
2. **Filter** by focus area (optional)
3. **Preview** a template to see all tasks
4. **Apply** the template
5. **Tasks appear** in their daily checklist as active
6. **Edit/delete** tasks as needed

### For Developers: Adding New System Templates

1. Add template definition to `supabase/seed/goal_templates.sql`
2. Include 3-5 small, achievable tasks per template
3. Mark tasks as optional where appropriate
4. Set `is_system: true` for availability to all users
5. Run seed script to populate database

## Design Principles

### Momentum-First
- **Small tasks**: 5-15 minutes each to ensure completion
- **Low friction**: One click to apply, one click to adjust
- **No perfectionism**: Optional tasks and easy defeaters

### Editability
- Tasks are **fully independent** after creation
- Users can modify, deactivate, or delete at will
- No reverse link to template prevents confusion

### Clarity
- Clear task titles and descriptions
- Duration estimates set realistic expectations
- Optional task indicator removes guilt

### Consistency
- Uses Tailwind CSS matching existing design
- Follows Next.js App Router patterns
- Integrates with existing task system seamlessly

## Implementation Notes

### Why No Foreign Key Back to Template?
After a template is applied, the created tasks should be independent. This allows:
- Tasks to be modified without affecting the template
- Template tasks to be updated without impacting users' actual tasks
- Clear mental model: "Apply creates a copy, not a reference"

### Cascading Deletes
Goal template deletions cascade to `goal_template_tasks` but NOT to created task_templates. User tasks are preserved even if a template is removed.

### Task Type
All tasks created from templates are `task_type: "recurring"`. Users can convert them to one-off after creation if needed.

## Future Enhancements

1. **Custom Templates**: Allow users to save their favorite task combinations
2. **Template Ratings**: Users rate templates to surface the best ones
3. **Smart Suggestions**: Recommend templates based on user's typical focus areas
4. **Time Blocks**: Group related templates (morning routine, evening wind-down)
5. **Analytics**: Track which templates lead to high completion rates
6. **Sharing**: Allow users to share custom templates with teams

## Testing

### Seed Data
Run the seed script to populate 5 system templates:
- Deep Work Session (Productivity)
- Skill Building (Training)
- Creative Flow (Creative)
- Daily Wellness (Health)
- Mindful Morning (Mindfulness)

### Manual Testing Checklist
- [ ] View all templates on `/templates`
- [ ] Filter by focus area
- [ ] Preview a template
- [ ] Apply a template
- [ ] Verify tasks appear in daily checklist
- [ ] Edit applied task
- [ ] Delete applied task
- [ ] Apply same template twice (should create duplicates)
- [ ] Error cases: no tasks, auth failure, invalid template

## TypeScript Types

```typescript
// Located in src/lib/task-types.ts

interface GoalTemplate {
  id: string;
  name: string;
  description: string | null;
  focus_area: string;
  is_system: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface GoalTemplateTask {
  id: string;
  goal_template_id: string;
  title: string;
  description: string | null;
  category: string;
  is_optional: boolean;
  estimated_duration_minutes: number | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface GoalTemplateWithTasks extends GoalTemplate {
  tasks: GoalTemplateTask[];
}

type GoalFocusArea = "Productivity" | "Training" | "Creative" | "Health" | "Mindfulness" | "Social";
```

## File Structure

```
src/
├── app/
│   ├── actions/
│   │   └── goal-templates.ts          # Server actions
│   └── templates/
│       └── page.tsx                    # Templates page
├── components/
│   ├── GoalTemplateCard.tsx           # Card display
│   ├── GoalTemplatePreview.tsx        # Preview modal
│   └── GoalTemplatesListView.tsx      # Main view
└── lib/
    └── task-types.ts                  # (updated) TypeScript types

supabase/
├── migrations/
│   └── create_goal_templates.sql      # Schema
└── seed/
    └── goal_templates.sql             # Example data
```

## Performance Considerations

- Templates are fetched server-side initially, reducing client-side load
- Individual template preview is fetched on-demand
- No N+1 queries: preview loads both template and tasks in one query
- Applied tasks are bulk-inserted in a single database operation
