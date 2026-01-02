import { supabaseServer } from "@/lib/supabase/server";
import HistoryView from "./HistoryView";

type LogRow = {
  log_date: string;
  completed: boolean;
  completed_at: string | null;
  task_templates: { title: string; category: string } | null;
};

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default async function HistoryPage() {
  const supabase = supabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user!;

  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(monthStart.getDate() - monthStart.getDay());
  const calendarEnd = new Date(monthEnd);
  calendarEnd.setDate(monthEnd.getDate() + (6 - monthEnd.getDay()));
  const calendarStartISO = formatDateKey(calendarStart);
  const calendarEndISO = formatDateKey(calendarEnd);

  const { data: logs, error } = await supabase
    .from("daily_task_logs")
    .select("log_date,completed,completed_at, task_templates(title,category)")
    .eq("user_id", user.id)
    .eq("completed", true)
    .gte("log_date", calendarStartISO)
    .lte("log_date", calendarEndISO)
    .order("log_date", { ascending: false });

  if (error) throw new Error(error.message);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <HistoryView
        logs={(logs ?? []).map((log) => log as LogRow)}
        month={today.getMonth()}
        year={today.getFullYear()}
        monthLabel={today.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })}
      />
    </main>
  );
}
