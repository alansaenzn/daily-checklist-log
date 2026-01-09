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
  "Uncategorized",
  "Training",
  "Creative",
  "Health",
  "General",
] as const;

export interface TaskTemplate {
  id: string;
  user_id: string;
  title: string;
  category: string;
  task_type: TaskType; // NEW: "recurring" or "one_off"
  is_active: boolean;
  archived_at: string | null; // Used for one-off tasks after completion
  created_at: string;
  updated_at: string;
  recurrence_interval_days?: number | null; // Recurring tasks: every N days (default 1)
  // Apple Reminders-style organization fields (optional)
  notes?: string | null;
  url?: string | null;
  due_date?: string | null; // YYYY-MM-DD
  due_time?: string | null; // HH:MM:SS
  list_name?: string | null;
  details?: string | null;
  priority?: TaskPriority; // Optional, defaults to "none"
}

export interface TaskLog {
  id: string;
  user_id: string;
  task_template_id: string;
  log_date: string; // YYYY-MM-DD
  completed: boolean;
  completed_at: string | null; // ISO timestamp when completed
}

/**
 * Daily checklist item combining template and log data
 */
export interface ChecklistItem {
  id: string;
  title: string;
  category: string;
  task_type: TaskType;
  checked: boolean;
  completed_at: string | null;
}

/**
 * Business logic for task visibility and behavior
 */
export const TaskBehavior = {
  /**
   * Determines if a task should appear in today's checklist
   * 
   * Recurring:
   * - Must be active
   * - No archived_at
   * 
   * One-off:
   * - If it has a completion log for today, keep it visible so the day’s count stays stable
   * - Otherwise, must not be completed and must not be archived
   */
  shouldAppearInChecklist(template: TaskTemplate, hasCompletedLog: boolean): boolean {
    // Hide any task that is already completed for the day
    if (hasCompletedLog) return false;

    // One-off tasks disappear after completion
    if (template.task_type === "one_off") {
      return !hasCompletedLog && !template.archived_at;
    }
    
    // Recurring tasks appear if active
    return template.is_active && !template.archived_at;
  },

  /**
   * Determines if a task can be reactivated
   * 
   * Recurring: Can always be reactivated
   * One-off: Cannot be reactivated after completion (data loss prevention)
   */
  canReactivate(template: TaskTemplate, hasCompletedLog: boolean): boolean {
    // One-off tasks that were completed cannot be reactivated
    if (template.task_type === "one_off" && hasCompletedLog) {
      return false;
    }
    return true;
  },

  /**
   * Determines if a task should auto-archive after completion
   * 
   * One-off: Yes, immediately archive after first completion
   * Recurring: No, never auto-archive
   */
  shouldAutoArchive(taskType: TaskType): boolean {
    return taskType === "one_off";
  },

  /**
   * Message explaining why a one-off task cannot be reactivated
   */
  getReactivationBlockedMessage(): string {
    return "One-off tasks cannot be reactivated after completion";
  },
} as const;

/**
 * Validation rules
 */
export const TaskValidation = {
  /**
   * Prevents converting recurring → one-off if it has multiple completion logs
   * This protects against losing task history visibility
   */
  canConvertToOneOff(taskType: TaskType, completionCount: number): boolean {
    // Recurring tasks can only convert to one-off if no completions exist
    if (taskType === "recurring" && completionCount > 0) {
      return false;
    }
    return true;
  },

  getConversionError(completionCount: number): string {
    return `Cannot convert: task has ${completionCount} completion log(s). Delete logs first or create a new one-off task.`;
  },
} as const;

/**
 * Goal Templates: Momentum-focused task blueprints
 * Users can apply these templates to quickly populate their daily tasks
 */
export interface GoalTemplate {
  id: string;
  name: string;
  description: string | null;
  focus_area: string;
  is_system: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoalTemplateTask {
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

/**
 * Combined view with template + its tasks
 */
export interface GoalTemplateWithTasks extends GoalTemplate {
  tasks: GoalTemplateTask[];
}

/**
 * Focus areas for goal templates
 */
export const GOAL_FOCUS_AREAS = [
  "Productivity",
  "Training",
  "Creative",
  "Health",
  "Mindfulness",
  "Social",
] as const;

export type GoalFocusArea = (typeof GOAL_FOCUS_AREAS)[number];
