import { supabaseServer } from "@/lib/supabase/server";
// import HistoryView from "./HistoryView";

type LogRow = {
  log_date: string;
  completed: boolean;
  completed_at: string | null;
  task_templates: { title: string; category: string } | null;
};

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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
    .gte("log_date", calendarStartISO)
    .lte("log_date", calendarEndISO)
    .order("log_date", { ascending: false });

    if (error) throw new Error(error.message);

    const completedByDate = new Map<string, LogRow[]>();
    (logs ?? []).forEach((log) => {
      if (!log.completed) return;
      const date = log.log_date as string;
      const existing = completedByDate.get(date) ?? [];
      // Ensure task_templates is an object, not array
      let taskTemplateObj = null;
      if (Array.isArray(log.task_templates)) {
        taskTemplateObj = log.task_templates[0] ?? null;
      } else {
        taskTemplateObj = log.task_templates ?? null;
      }
      completedByDate.set(date, [...existing, {
        log_date: log.log_date,
        completed: log.completed,
        completed_at: log.completed_at,
        task_templates: taskTemplateObj,
      }]);
    });

    const calendarDays: Date[] = [];
    for (
      let cursor = new Date(calendarStart);
      cursor <= calendarEnd;
      cursor.setDate(cursor.getDate() + 1)
    ) {
      calendarDays.push(new Date(cursor));
    }

    return (
      <main className="mx-auto max-w-6xl p-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">History</h1>
          <p className="text-sm text-gray-600">
            {today.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
        </header>
        <div className="rounded-xl border bg-white shadow-sm">
          <div className="grid grid-cols-7 border-b bg-zinc-50 text-sm font-medium text-zinc-600">
            {weekdayLabels.map((label) => (
              <div key={label} className="px-3 py-2 text-left">
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarDays.map((date) => {
              const dateKey = formatDateKey(date);
              const entries = completedByDate.get(dateKey) ?? [];
              const inCurrentMonth = date.getMonth() === today.getMonth();
              const isToday = formatDateKey(date) === formatDateKey(today);
              const visibleEntries = entries.slice(0, 3);
              const remaining = entries.length - visibleEntries.length;
              return (
                <div
                  key={dateKey}
                  className={`min-h-[140px] border-b border-r px-3 py-3 text-sm last:border-r-0 ${
                    inCurrentMonth ? "bg-white" : "bg-zinc-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                        isToday
                          ? "bg-emerald-500 text-white"
                          : inCurrentMonth
                          ? "text-zinc-900"
                          : "text-zinc-400"
                      }`}
                    >
                      {date.getDate()}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1">
                    {visibleEntries.length === 0 ? (
                      <p className="text-xs text-zinc-400">No completed tasks</p>
                    ) : (
                      visibleEntries.map((entry, idx) => (
                        <div
                          key={`${dateKey}-${idx}`}
                          className="flex items-center gap-2 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700"
                        >
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          <span className="truncate">
                            {entry.task_templates?.title ?? "Untitled task"}
                          </span>
                        </div>
                      ))
                    )}
                    {remaining > 0 ? (
                      <p className="text-xs font-medium text-zinc-500">
                        +{remaining} more
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    );
}
