import { supabaseServer } from "@/lib/supabase/server";
import { ArchiveDailyTaskEntry } from "@/types/archive";

type SupabaseServerClient = ReturnType<typeof supabaseServer>;

export const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const fetchCompletedCountByDate = async (
  supabase: SupabaseServerClient,
  userId: string,
  startDate: string,
  endDate: string
): Promise<Record<string, number>> => {
  const { data: logs, error } = await supabase
    .from("daily_task_logs")
    .select("log_date,completed")
    .eq("user_id", userId)
    .gte("log_date", startDate)
    .lte("log_date", endDate)
    .order("log_date", { ascending: false });

  if (error) throw new Error(error.message);

  const completedCountByDate: Record<string, number> = {};
  (logs ?? []).forEach((log) => {
    if (!log.completed) return;
    const date = log.log_date as string;
    completedCountByDate[date] = (completedCountByDate[date] || 0) + 1;
  });

  return completedCountByDate;
};

export const fetchCompletedTasksByDate = async (
  supabase: SupabaseServerClient,
  userId: string,
  startDate: string,
  endDate: string
): Promise<Record<string, ArchiveDailyTaskEntry[]>> => {
  const { data: logs, error } = await supabase
    .from("daily_task_logs")
    .select("log_date,completed,completed_at, task_templates(title,category,notes,details,task_type)")
    .eq("user_id", userId)
    .eq("completed", true)
    .gte("log_date", startDate)
    .lte("log_date", endDate)
    .order("log_date", { ascending: false });

  if (error) throw new Error(error.message);

  const completedTasksByDate: Record<string, ArchiveDailyTaskEntry[]> = {};
  (logs ?? []).forEach((log) => {
    const date = log.log_date as string;
    const template = (Array.isArray(log.task_templates) ? log.task_templates[0] : log.task_templates) as
      | { title: string; category: string; notes?: string | null; details?: string | null; task_type?: any }
      | null
      | undefined;
    const title = template?.title || "Completed task";
    const category = template?.category || "General";
    if (!completedTasksByDate[date]) completedTasksByDate[date] = [];
    completedTasksByDate[date].push({
      title,
      category,
      completed_at: log.completed_at,
      notes: template?.notes ?? null,
      details: template?.details ?? null,
      task_type: template?.task_type ?? undefined,
    });
  });

  return completedTasksByDate;
};

export const fetchScheduledTasksByDate = async (
  supabase: SupabaseServerClient,
  userId: string,
  startDate: string,
  endDate: string
): Promise<Record<string, { title: string; category: string }[]>> => {
  const { data: templates, error } = await supabase
    .from("task_templates")
    .select("id,title,category,due_date")
    .eq("user_id", userId)
    .not("due_date", "is", null)
    .gte("due_date", startDate)
    .lte("due_date", endDate);

  if (error) throw new Error(error.message);

  const scheduledTasksByDate: Record<string, { title: string; category: string }[]> = {};
  (templates ?? []).forEach((tmpl) => {
    const date = tmpl.due_date as string;
    if (!scheduledTasksByDate[date]) scheduledTasksByDate[date] = [];
    scheduledTasksByDate[date].push({
      title: tmpl.title as string,
      category: tmpl.category as string,
    });
  });

  return scheduledTasksByDate;
};

export const getEarliestLogDate = async (
  supabase: SupabaseServerClient,
  userId: string
): Promise<string | null> => {
  const { data, error } = await supabase
    .from("daily_task_logs")
    .select("log_date")
    .eq("user_id", userId)
    .order("log_date", { ascending: true })
    .limit(1);

  if (error) throw new Error(error.message);
  return data?.[0]?.log_date ?? null;
};

export const getLatestLogDate = async (
  supabase: SupabaseServerClient,
  userId: string
): Promise<string | null> => {
  const { data, error } = await supabase
    .from("daily_task_logs")
    .select("log_date")
    .eq("user_id", userId)
    .order("log_date", { ascending: false })
    .limit(1);

  if (error) throw new Error(error.message);
  return data?.[0]?.log_date ?? null;
};
