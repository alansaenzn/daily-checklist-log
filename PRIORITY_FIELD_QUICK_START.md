PRIORITY FIELD - QUICK START
===========================

## What Was Added

Apple Reminders–style priority field for task creation. Users can now assign tasks a priority level when creating them.

---

## Quick Reference

### Priority Levels
- **None** (Default) - Gray
- **Low** - Blue
- **Medium** - Orange
- **High** - Red

### Where It Appears
- Tasks page → Create task form
- Advanced Options section (below Notes)
- 4 segmented buttons to select priority

### How to Use
1. Go to Tasks page
2. Click "Advanced Options" in the create form
3. Find the Priority selector
4. Click one of: None, Low, Medium, High
5. Create task as normal
6. Priority is automatically saved to Supabase

---

## Files to Know

### Types
- `src/lib/task-types.ts` - TaskPriority type definition

### Utilities
- `src/lib/priority-utils.ts` - Color/styling config for priorities

### Server
- `src/app/actions/tasks.ts` - createTaskTemplate() handles priority

### UI
- `src/app/tasks/TaskForm.tsx` - Priority selector component

### Database
- `supabase/migrations/add_priority_field.sql` - DB schema

---

## Testing Checklist

- [ ] Create task with priority=None
- [ ] Create task with priority=Low
- [ ] Create task with priority=Medium
- [ ] Create task with priority=High
- [ ] Verify in Supabase that priority is saved
- [ ] Test on mobile screen size
- [ ] Test dark mode colors

---

## For Developers

### Access Priority Config
```typescript
import { PriorityConfig, getPriorityConfig } from "@/lib/priority-utils";

// Get config for a specific level
const config = getPriorityConfig("high");
console.log(config.bgColor); // "bg-red-100 dark:bg-red-900/30"
console.log(config.label);   // "High"
```

### Add Priority to Task Display
```typescript
import { getPriorityIndicator } from "@/lib/priority-utils";

// Render priority indicator in task list
<span>{getPriorityIndicator(task.priority)}</span>
```

### Filter by Priority
```typescript
// Future use: query tasks by priority
const { data } = await supabase
  .from("task_templates")
  .select()
  .eq("priority", "high")
  .eq("user_id", userId);
```

---

## Database Details

### Migration Applied
```sql
CREATE TYPE task_priority AS ENUM ('none', 'low', 'medium', 'high');
ALTER TABLE task_templates ADD COLUMN priority task_priority DEFAULT 'none';
CREATE INDEX idx_task_templates_priority ON task_templates(priority) WHERE priority != 'none';
```

### Column Info
- Table: `task_templates`
- Column: `priority`
- Type: `task_priority` (enum)
- Default: `'none'`
- Nullable: No (always has a value)

---

## Visual Reference

```
Task Creation Form
┌──────────────────────────┐
│ Title: [...]             │
│ Category: [General ▼]    │
│ Task Type: ◉ Recurring   │
│ ▼ Advanced Options       │
│ ├─ Notes: [...]          │
│ ├─ Priority:             │  ← NEW
│ │  [None][Low][Med][High]│  ← NEW
│ ├─ URL: [...]            │
│ └─ ...                   │
└──────────────────────────┘
```

---

## What's NOT Changed

- Archive page (unchanged)
- Templates page (unchanged)
- Today/History views (unchanged)
- Task editing in other areas (unchanged)
- No modals or complex flows added
- No new external dependencies

---

## Next Steps

### To Deploy
1. Apply database migration: `supabase db push`
2. Deploy code changes
3. Test task creation with priorities

### To Extend
1. Show priority indicators in task lists
2. Filter/sort by priority
3. Add priority colors to today's checklist
4. Archive view with priority filtering

---

## Need Help?

### Troubleshooting

**Priority selector not showing?**
- Check that Advanced Options is expanded
- Verify TaskForm.tsx imports are correct

**Priority not saving?**
- Check Supabase migration was applied
- Verify task_templates table has priority column

**Colors not showing?**
- Check dark mode is enabled in browser
- Verify Tailwind CSS is building correctly

### Files to Check

- Type errors? → Check `src/lib/task-types.ts`
- UI issues? → Check `src/app/tasks/TaskForm.tsx`
- Color issues? → Check `src/lib/priority-utils.ts`
- Database issues? → Check migration was applied

---

## Support

All files are fully documented. See these files for more details:
- `PRIORITY_FIELD_IMPLEMENTATION.md` - Full technical details
- `PRIORITY_FIELD_CODE_CHANGES.md` - Code diff reference
- `PRIORITY_FIELD_DELIVERY_CHECKLIST.md` - Complete checklist
