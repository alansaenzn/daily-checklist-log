export type ArchiveDailyTaskEntry = {
  title: string;
  category: string;
  completed_at: string | null;
  isScheduled?: boolean;
  // Optional extended fields carried from the template at completion time
  notes?: string | null;
  details?: string | null;
  // Task type (recurring or one_off) when available
  task_type?: import("@/lib/task-types").TaskType;
};
