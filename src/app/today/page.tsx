import { supabaseServer } from "@/lib/supabase/server";
import TodayChecklist from "./today-checklist";
import { formatLocalDate } from "@/lib/local-date";
import { TaskBehavior, type TaskType } from "@/lib/task-types";
import { requireAuth } from "@/lib/auth";

export default async function TodayPage() {
  const user = await requireAuth();
  const supabase = supabaseServer();
  const today = formatLocalDate();

  // Fetch all task templates with task_type (default to "recurring" for backward compatibility)
  const { data: templates, error: tErr } = await supabase
    .from("task_templates")
    .select(
      "id,title,category,is_active,task_type,archived_at,notes,details,due_date,due_time,list_name,project_id,priority,created_at,recurrence_interval_days,recurrence_days_mask"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (tErr) throw new Error(tErr.message);

  // Fetch today's completion logs
  const { data: logs, error: lErr } = await supabase
    .from("daily_task_logs")
    .select("task_template_id,completed,completed_at")
    .eq("user_id", user.id)
    .eq("log_date", today);

  if (lErr) throw new Error(lErr.message);

  // Build map of task IDs to their completion state
  const logMap = new Map<
    string,
    { completed: boolean; completed_at: string | null }
  >();
  (logs ?? []).forEach((l) => logMap.set(l.task_template_id, l));

  // Filter templates to show in checklist
  // Recurring: must be active and not archived
  // One-off: must not be completed and not archived, BUT if completed today, still show so it stays counted
  const todayIndex = new Date().getDay(); // 0=Sunday ... 6=Saturday

  const visibleTemplates = (templates ?? []).filter((t) => {
    const taskType = (t.task_type as TaskType) || "recurring";
    const hasCompletedLog = logMap.get(t.id as string)?.completed ?? false;

    // If recurring and a weekly mask is present, only show when today's bit is set
    if (taskType === "recurring") {
      const mask = (t as any).recurrence_days_mask as number | null | undefined;
      if (typeof mask === "number" && mask > 0) {
        const showToday = (mask & (1 << todayIndex)) !== 0;
        if (!showToday) {
          return false;
        }
      }
    }

    return TaskBehavior.shouldAppearInChecklist(
      {
        id: t.id as string,
        title: t.title as string,
        category: t.category as string,
        task_type: taskType,
        is_active: t.is_active as boolean,
        archived_at: t.archived_at as string | null,
        user_id: user.id,
        created_at: "",
        updated_at: "",
      },
      hasCompletedLog
    );
  });

  const items = visibleTemplates.map((t) => ({
    id: t.id as string,
    title: t.title as string,
    category: t.category as string,
    task_type: (t.task_type as TaskType) || "recurring",
    checked: logMap.get(t.id as string)?.completed ?? false,
    completed_at: logMap.get(t.id as string)?.completed_at ?? null,
    notes: t.notes ?? null,
    details: t.details ?? null,
    due_date: t.due_date ?? null,
    due_time: t.due_time ?? null,
    list_name: t.list_name ?? null,
    project_id: t.project_id ?? null,
    priority: t.priority ?? null,
    created_at: t.created_at ?? null,
  }));

  return (
    <main className="mx-auto max-w-xl px-4 py-6 space-y-6 min-h-screen">
      <TodayChecklist initialItems={items} />
    </main>
  );
}
