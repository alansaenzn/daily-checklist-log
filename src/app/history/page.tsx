import { supabaseServer } from "@/lib/supabase/server";

type LogRow = {
  log_date: string;
  completed: boolean;
  completed_at: string | null;
  task_templates: { title: string; category: string } | null;
};

export default async function HistoryPage() {
  const supabase = supabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user!;

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceISO = since.toISOString().slice(0, 10);

  const { data: logs, error } = await supabase
    .from("daily_task_logs")
    .select("log_date,completed,completed_at, task_templates(title,category)")
    .eq("user_id", user.id)
    .gte("log_date", sinceISO)
    .order("log_date", { ascending: false });

  if (error) throw new Error(error.message);

  const byDate = new Map<string, LogRow[]>();
  (logs ?? []).forEach((log) => {
    const date = log.log_date as string;
    const existing = byDate.get(date) ?? [];
    byDate.set(date, [...existing, log as LogRow]);
  });

  const dates = Array.from(byDate.keys());

  return (
    <main className="mx-auto max-w-xl p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">History</h1>
        <p className="text-sm text-gray-600">Last 30 days</p>
      </header>

      {dates.length === 0 ? (
        <p className="text-gray-600">No history yet.</p>
      ) : (
        <div className="space-y-4">
          {dates.map((date) => {
            const rows = byDate.get(date)!;
            const completed = rows.filter((row) => row.completed).length;
            return (
              <section key={date} className="rounded border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{date}</div>
                  <div className="text-sm text-gray-600">
                    {completed} / {rows.length}
                  </div>
                </div>

                <ul className="space-y-1">
                  {rows.map((row, idx) => (
                    <li key={idx} className="text-sm flex justify-between">
                      <span>
                        {row.task_templates?.title}{" "}
                        <span className="text-gray-500">
                          ({row.task_templates?.category})
                        </span>
                      </span>
                      <span>{row.completed ? "✅" : "—"}</span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
