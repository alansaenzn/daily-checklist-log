PRIORITY FIELD - CODE CHANGES REFERENCE
========================================

## Overview of All Changes

This document shows the exact modifications made to implement the priority field feature.

---

## 1. NEW FILE: src/lib/priority-utils.ts

```typescript
/**
 * Apple Reminders-style priority utility functions and styles
 */

import type { TaskPriority } from "./task-types";

export const PriorityConfig = {
  none: {
    label: "None",
    color: "gray",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    textColor: "text-gray-700 dark:text-gray-300",
    borderColor: "border-gray-300 dark:border-gray-600",
    ringColor: "focus:ring-gray-500",
    hoverBg: "hover:bg-gray-50 dark:hover:bg-gray-700/50",
  },
  low: {
    label: "Low",
    color: "blue",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    textColor: "text-blue-700 dark:text-blue-300",
    borderColor: "border-blue-300 dark:border-blue-600",
    ringColor: "focus:ring-blue-500",
    hoverBg: "hover:bg-blue-50 dark:hover:bg-blue-800/20",
  },
  medium: {
    label: "Medium",
    color: "orange",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    textColor: "text-orange-700 dark:text-orange-300",
    borderColor: "border-orange-300 dark:border-orange-600",
    ringColor: "focus:ring-orange-500",
    hoverBg: "hover:bg-orange-50 dark:hover:bg-orange-800/20",
  },
  high: {
    label: "High",
    color: "red",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    textColor: "text-red-700 dark:text-red-300",
    borderColor: "border-red-300 dark:border-red-600",
    ringColor: "focus:ring-red-500",
    hoverBg: "hover:bg-red-50 dark:hover:bg-red-800/20",
  },
} as const;

export function getPriorityConfig(priority: TaskPriority) {
  return PriorityConfig[priority];
}

export function getPriorityIndicator(priority: TaskPriority): string {
  switch (priority) {
    case "high":
      return "🔴";
    case "medium":
      return "🟠";
    case "low":
      return "🔵";
    case "none":
    default:
      return "⚪";
  }
}
```

---

## 2. NEW FILE: supabase/migrations/add_priority_field.sql

```sql
-- Add priority field to task_templates table
-- Apple Reminders-style priority levels: none, low, medium, high
-- All fields are optional to maintain backward compatibility

-- Create enum type for priority if it doesn't exist
CREATE TYPE task_priority AS ENUM ('none', 'low', 'medium', 'high');

-- Add priority column with default 'none'
ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS priority task_priority DEFAULT 'none';

-- Create index for priority queries
CREATE INDEX IF NOT EXISTS idx_task_templates_priority ON task_templates(priority) WHERE priority != 'none';

-- Comment for documentation
COMMENT ON COLUMN task_templates.priority IS 'Apple Reminders-style priority level (none, low, medium, high)';
```

---

## 3. MODIFIED: src/lib/task-types.ts

### BEFORE
```typescript
/**
 * Task type definitions for supporting both recurring and one-off tasks
 * 
 * Recurring: Tasks that appear daily/weekly and can be logged multiple times
 * One-off: Tasks that appear once, auto-archive after completion
 */

export type TaskType = "recurring" | "one_off";

/**
 * Standard task categories
 */
export const TASK_CATEGORIES = [
  // ...
]

export interface TaskTemplate {
  id: string;
  user_id: string;
  title: string;
  category: string;
  task_type: TaskType;
  is_active: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  notes?: string | null;
  url?: string | null;
  due_date?: string | null;
  due_time?: string | null;
  list_name?: string | null;
  details?: string | null;
}
```

### AFTER
```typescript
/**
 * Task type definitions for supporting both recurring and one-off tasks
 * 
 * Recurring: Tasks that appear daily/weekly and can be logged multiple times
 * One-off: Tasks that appear once, auto-archive after completion
 */

export type TaskType = "recurring" | "one_off";

/**
 * Apple Reminders-style priority levels
 */
export type TaskPriority = "none" | "low" | "medium" | "high";

export const TASK_PRIORITY_LEVELS = ["none", "low", "medium", "high"] as const;

/**
 * Standard task categories
 */
export const TASK_CATEGORIES = [
  // ...
]

export interface TaskTemplate {
  id: string;
  user_id: string;
  title: string;
  category: string;
  task_type: TaskType;
  is_active: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  notes?: string | null;
  url?: string | null;
  due_date?: string | null;
  due_time?: string | null;
  list_name?: string | null;
  details?: string | null;
  priority?: TaskPriority; // Optional, defaults to "none"
}
```

---

## 4. MODIFIED: src/app/actions/tasks.ts

### Import Changes
```typescript
// BEFORE
import { TaskBehavior, TaskValidation, type TaskType } from "@/lib/task-types";

// AFTER
import { TaskBehavior, TaskValidation, type TaskType, type TaskPriority, TASK_PRIORITY_LEVELS } from "@/lib/task-types";
```

### updateTaskTemplate() Signature Change
```typescript
// BEFORE
export async function updateTaskTemplate(
  taskTemplateId: string,
  updates: {
    title?: string;
    category?: string;
    task_type?: TaskType;
    notes?: string | null;
    url?: string | null;
    due_date?: string | null;
    due_time?: string | null;
    list_name?: string | null;
    details?: string | null;
    project_id?: string | null;
  }
)

// AFTER
export async function updateTaskTemplate(
  taskTemplateId: string,
  updates: {
    title?: string;
    category?: string;
    task_type?: TaskType;
    notes?: string | null;
    url?: string | null;
    due_date?: string | null;
    due_time?: string | null;
    list_name?: string | null;
    details?: string | null;
    priority?: TaskPriority; // Priority level
    project_id?: string | null;
  }
)
```

### createTaskTemplate() Function Changes
```typescript
// BEFORE
export async function createTaskTemplate(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const category = String(formData.get("category") || "General").trim();
  const taskType = String(formData.get("task_type") || "recurring") as TaskType;

  const notes = formData.get("notes") ? String(formData.get("notes")).trim() : null;
  const url = formData.get("url") ? String(formData.get("url")).trim() : null;
  const due_date = formData.get("due_date") ? String(formData.get("due_date")) : null;
  const due_time = formData.get("due_time") ? String(formData.get("due_time")) : null;
  const list_name = formData.get("list_name") ? String(formData.get("list_name")).trim() : null;
  const details = formData.get("details") ? String(formData.get("details")).trim() : null;
  
  const project_id = formData.get("project_id") ? String(formData.get("project_id")).trim() : null;

  // ... validation code ...

  const { error } = await supabase.from("task_templates").insert({
    user_id: userData.user.id,
    title,
    category,
    task_type: taskType,
    is_active: true,
    archived_at: null,
    notes,
    url,
    due_date,
    due_time,
    list_name,
    details,
    project_id,
  });
}

// AFTER
export async function createTaskTemplate(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const category = String(formData.get("category") || "General").trim();
  const taskType = String(formData.get("task_type") || "recurring") as TaskType;

  const notes = formData.get("notes") ? String(formData.get("notes")).trim() : null;
  const url = formData.get("url") ? String(formData.get("url")).trim() : null;
  const due_date = formData.get("due_date") ? String(formData.get("due_date")) : null;
  const due_time = formData.get("due_time") ? String(formData.get("due_time")) : null;
  const list_name = formData.get("list_name") ? String(formData.get("list_name")).trim() : null;
  const details = formData.get("details") ? String(formData.get("details")).trim() : null;
  
  // Priority level (defaults to "none" if not provided)
  const priorityValue = formData.get("priority") ? String(formData.get("priority")).trim() : "none";
  const priority = TASK_PRIORITY_LEVELS.includes(priorityValue as TaskPriority) 
    ? (priorityValue as TaskPriority) 
    : "none";
  
  const project_id = formData.get("project_id") ? String(formData.get("project_id")).trim() : null;

  // ... validation code ...

  const { error } = await supabase.from("task_templates").insert({
    user_id: userData.user.id,
    title,
    category,
    task_type: taskType,
    is_active: true,
    archived_at: null,
    notes,
    url,
    due_date,
    due_time,
    list_name,
    details,
    priority,
    project_id,
  });
}
```

---

## 5. MODIFIED: src/app/tasks/TaskForm.tsx

### Import Changes
```typescript
// BEFORE
import { TASK_CATEGORIES } from "@/lib/task-types";

// AFTER
import { TASK_CATEGORIES, TASK_PRIORITY_LEVELS, type TaskPriority } from "@/lib/task-types";
import { PriorityConfig } from "@/lib/priority-utils";
```

### State Changes
```typescript
// ADDED
const [priority, setPriority] = useState<TaskPriority>("none");
```

### Form Submission Changes
```typescript
// ADDED (in handleSubmit function)
// Add priority
formData.set("priority", priority);
```

### Form Reset Changes
```typescript
// BEFORE
setSelectedCategory("General");
setCustomCategory("");
setDueDate("");
setProjectId("");

// AFTER
setSelectedCategory("General");
setCustomCategory("");
setDueDate("");
setProjectId("");
setPriority("none");
```

### New Priority UI Component
```typescript
// ADDED (in Advanced Options section, after Notes)
{/* Priority */}
<div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
    Priority
  </label>
  <div className="flex gap-2">
    {TASK_PRIORITY_LEVELS.map((level) => {
      const config = PriorityConfig[level];
      const isSelected = priority === level;
      return (
        <button
          key={level}
          type="button"
          onClick={() => setPriority(level)}
          disabled={isSubmitting}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border ${
            isSelected
              ? `${config.bgColor} ${config.textColor} border-current`
              : `border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:${config.hoverBg}`
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {config.label}
        </button>
      );
    })}
  </div>
  <input type="hidden" name="priority" value={priority} />
</div>
```

---

## Summary of Changes

| File | Type | Changes |
|------|------|---------|
| `src/lib/priority-utils.ts` | Created | New utility file with priority config |
| `supabase/migrations/add_priority_field.sql` | Created | Database migration for priority column |
| `src/lib/task-types.ts` | Modified | Added TaskPriority type and constant |
| `src/app/actions/tasks.ts` | Modified | Priority handling in create/update |
| `src/app/tasks/TaskForm.tsx` | Modified | Priority state and UI component |

**Total Lines Added**: ~130 lines across 5 files
**No Breaking Changes**: All modifications are additive with backward compatibility
**Type Safety**: Full TypeScript support with no 'any' types
