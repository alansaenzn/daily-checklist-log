/**
 * Active Page
 * 
 * Where users see active tasks and check them off
 * Execution surface for daily task completion
 */

import { supabaseServer } from "@/lib/supabase/server";
import TodayChecklist from "../today/today-checklist";
import { UserSettingsProvider } from "@/components/UserSettingsProvider";
import { requireAuth } from "@/lib/auth";
import { fetchUserSettings } from "@/lib/user-settings";
import { formatLocalDate } from "@/lib/local-date";
import { TaskBehavior, type TaskType } from "@/lib/task-types";

export const metadata = {
  title: "Active",
  description: "Check off your active tasks",
};

export default async function ActivePage() {
  const user = await requireAuth();
  const supabase = supabaseServer();
  const today = formatLocalDate();

  // Fetch all task templates with task_type (default to "recurring" for backward compatibility)
  const { data: templates, error: tErr } = await supabase
    .from("task_templates")
    .select(
      "id,title,category,is_active,task_type,archived_at,notes,details,due_date,due_time,list_name,project_id,priority,created_at,difficulty"
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

  const { data: projects } = await supabase
    .from("projects")
    .select("id,name")
    .eq("user_id", user.id);

  const projectLookup = Object.fromEntries(
    (projects ?? []).map((p) => [p.id, p.name])
  );

  // Build map of task IDs to their completion state
  const logMap = new Map<
    string,
    { completed: boolean; completed_at: string | null }
  >();
  (logs ?? []).forEach((l) => logMap.set(l.task_template_id, l));

  // Filter templates to show in checklist
  // Recurring: must be active and not archived
  // One-off: must not be completed and not archived, BUT if completed today, still show so it stays counted
  const visibleTemplates = (templates ?? []).filter((t) => {
    const taskType = (t.task_type as TaskType) || "recurring";
    const hasCompletedLog = logMap.get(t.id as string)?.completed ?? false;

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
    difficulty: (t as any).difficulty ?? null,
    created_at: t.created_at ?? null,
  }));

  const settings = await fetchUserSettings(supabase, user.id);

  return (
    <UserSettingsProvider initialSettings={settings} userEmail={user.email ?? null} userId={user.id}>
      <main className="mx-auto max-w-xl px-4 py-6 space-y-6 min-h-screen">
        <TodayChecklist initialItems={items} projectLookup={projectLookup} />
      </main>
    </UserSettingsProvider>
  );
}
