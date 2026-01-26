/**
 * Dashboard Page
 * 
 * Main reflection surface with tabs:
 * - Momentum: Progress snapshot and health
 * - Calendar: Preview of scheduled tasks (next 7 days)
 * - Projects: Contextual organization of work
 */

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { DashboardView } from "@/components/DashboardView";
import type { ScheduledTask, TimelineSourceTask } from "@/components/CalendarTabView";
import { getProjectsWithCounts } from "@/app/actions/projects";

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const fetchAggregatedData = async (
  supabase: ReturnType<typeof supabaseServer>,
  userId: string,
  startDate: string,
  endDate: string
): Promise<{ countByDate: Record<string, number>; difficultySumByDate: Record<string, number>; completedByDate: Record<string, number[]> }> => {
  type AggregatedLogRow = {
    log_date: string;
    completed: boolean;
    task_templates: { difficulty: number | null } | null;
  };

  const { data: logs, error } = await supabase
    .from("daily_task_logs")
    .select("log_date,completed,completed_at, task_templates(title,category,difficulty)")
    .eq("user_id", userId)
    .gte("log_date", startDate)
    .lte("log_date", endDate)
    .order("log_date", { ascending: false });

  if (error) throw new Error(error.message);

  const completedCountByDate: Record<string, number> = {};
  const difficultySumByDate: Record<string, number> = {};
  const completedByDate: Record<string, number[]> = {};
  
  (logs as unknown as AggregatedLogRow[] | null ?? []).forEach((log) => {
    if (!log.completed) return;
    const date = log.log_date as string;
    completedCountByDate[date] = (completedCountByDate[date] || 0) + 1;

    const difficultyRaw = log.task_templates?.difficulty;
    const difficulty =
      typeof difficultyRaw === "number" && difficultyRaw >= 1 && difficultyRaw <= 5
        ? Math.floor(difficultyRaw)
        : 3;
    difficultySumByDate[date] = (difficultySumByDate[date] || 0) + difficulty;
    
    if (!completedByDate[date]) {
      completedByDate[date] = [];
    }
    completedByDate[date].push(difficulty);
  });

  return { countByDate: completedCountByDate, difficultySumByDate, completedByDate };
};

/**
 * Fetch scheduled tasks (tasks with due_date set) for the next 7 days
 */
async function fetchScheduledTasks(
  supabase: ReturnType<typeof supabaseServer>,
  userId: string
): Promise<ScheduledTask[]> {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 6); // Next 7 days

  const startISO = formatDateKey(today);
  const endISO = formatDateKey(endDate);

  const { data, error } = await supabase
    .from("task_templates")
    .select("id,title,category,due_date,due_time")
    .eq("user_id", userId)
    .not("due_date", "is", null)
    .gte("due_date", startISO)
    .lte("due_date", endISO)
    .order("due_date", { ascending: true });

  if (error) {
    console.error("Failed to fetch scheduled tasks:", error.message);
    return [];
  }

  return (data || []) as ScheduledTask[];
}

async function fetchTimelineTasks(
  supabase: ReturnType<typeof supabaseServer>,
  userId: string,
  startISO: string,
  endISO: string
): Promise<TimelineSourceTask[]> {
  const { data, error } = await supabase
    .from("task_templates")
    .select(
      "id,title,category,project_id,task_type,created_at,due_date,due_time,recurrence_interval_days,is_active,archived_at"
    )
    .eq("user_id", userId)
    .eq("is_active", true)
    .is("archived_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch timeline tasks:", error.message);
    return [];
  }

  const filtered = (data || []).filter((task) => {
    if (task.task_type === "recurring") return true;
    if (!task.due_date) return false;
    return task.due_date >= startISO && task.due_date <= endISO;
  });

  return filtered as TimelineSourceTask[];
}

/**
 * Fetch scheduled task difficulties for the last 7 days
 * 
 * For system health calculation, "scheduled" means all active tasks that should
 * have been worked on each day. This includes:
 * - All recurring tasks (they're always "on the schedule")
 * - One-off tasks with due dates in the range
 * - Active tasks without due dates (part of daily work)
 */
async function fetchScheduledTasksByDate(
  supabase: ReturnType<typeof supabaseServer>,
  userId: string,
  startDate: string,
  endDate: string
): Promise<Record<string, number[]>> {
  const { data, error } = await supabase
    .from("task_templates")
    .select("id,task_type,due_date,difficulty,is_active,archived_at,created_at")
    .eq("user_id", userId)
    .eq("is_active", true)
    .is("archived_at", null);

  if (error) {
    console.error("Failed to fetch scheduled tasks by date:", error.message);
    return {};
  }

  const scheduledByDate: Record<string, number[]> = {};
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Generate all dates in range
  const dates: string[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(formatDateKey(new Date(d)));
  }

  (data || []).forEach((task) => {
    const difficulty =
      typeof task.difficulty === "number" && task.difficulty >= 1 && task.difficulty <= 5
        ? Math.floor(task.difficulty)
        : 3;

    const taskCreatedDate = new Date(task.created_at as string);

    dates.forEach((dateKey) => {
      const currentDate = new Date(dateKey);
      
      // Skip if task wasn't created yet on this date
      if (currentDate < taskCreatedDate) return;

      // Include task if:
      // 1. It's recurring (always scheduled)
      // 2. It's one-off with a due date matching this date
      // 3. It's one-off without a due date (consider scheduled for all days after creation)
      const isRecurring = task.task_type === "recurring";
      const hasDueDateOnThisDay = task.due_date === dateKey;
      const isOneOffWithoutDueDate = task.task_type === "one_off" && !task.due_date;

      if (isRecurring || hasDueDateOnThisDay || isOneOffWithoutDueDate) {
        if (!scheduledByDate[dateKey]) {
          scheduledByDate[dateKey] = [];
        }
        scheduledByDate[dateKey].push(difficulty);
      }
    });
  });

  return scheduledByDate;
}

export const metadata = {
  title: "Dashboard",
  description: "Your momentum snapshot, scheduled tasks, and projects",
};

export default async function DashboardPage() {
  const supabase = supabaseServer();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const user = userData.user;

  // Fetch heatmap data for the current month
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);

  const monthStartISO = formatDateKey(monthStart);
  const monthEndISO = formatDateKey(monthEnd);

  let heatmapData: Record<string, number> = {};
  let difficultySumByDate: Record<string, number> = {};
  let completedByDate: Record<string, number[]> = {};
  
  try {
    const aggregated = await fetchAggregatedData(
      supabase,
      user.id,
      monthStartISO,
      monthEndISO
    );
    heatmapData = aggregated.countByDate;
    difficultySumByDate = aggregated.difficultySumByDate;
    completedByDate = aggregated.completedByDate;
  } catch (error) {
    console.error("Failed to fetch heatmap data:", error);
  }

  // Fetch last 7 days of scheduled task difficulties for system health
  const last7Start = new Date(today);
  last7Start.setDate(today.getDate() - 6);
  const last7StartISO = formatDateKey(last7Start);
  const last7EndISO = formatDateKey(today);

  let scheduledByDate: Record<string, number[]> = {};
  try {
    scheduledByDate = await fetchScheduledTasksByDate(
      supabase,
      user.id,
      last7StartISO,
      last7EndISO
    );
  } catch (error) {
    console.error("Failed to fetch scheduled tasks for system health:", error);
  }

  // Fetch scheduled tasks for Calendar tab
  let scheduledTasks: ScheduledTask[] = [];
  try {
    scheduledTasks = await fetchScheduledTasks(supabase, user.id);
  } catch (error) {
    console.error("Failed to fetch scheduled tasks:", error);
  }

  // Fetch timeline tasks (recurring + scheduled within 30 days)
  const timelineStartISO = formatDateKey(today);
  const timelineEnd = new Date(today);
  timelineEnd.setDate(today.getDate() + 29);
  const timelineEndISO = formatDateKey(timelineEnd);

  let timelineTasks: TimelineSourceTask[] = [];
  try {
    timelineTasks = await fetchTimelineTasks(
      supabase,
      user.id,
      timelineStartISO,
      timelineEndISO
    );
  } catch (error) {
    console.error("Failed to fetch timeline tasks:", error);
  }

  // Fetch projects for Projects tab
  let projects: Awaited<ReturnType<typeof getProjectsWithCounts>> = [];
  try {
    projects = await getProjectsWithCounts();
  } catch (error) {
    console.error("Failed to fetch projects:", error);
  }

  return (
    <DashboardView
      heatmapData={heatmapData}
      heatmapDifficultySumData={difficultySumByDate}
      heatmapYear={year}
      heatmapMonth={month}
      scheduledTasks={scheduledTasks}
      timelineTasks={timelineTasks}
      projects={projects}
      momentumCompletedByDate={completedByDate}
      momentumScheduledByDate={scheduledByDate}
    />
  );
}
