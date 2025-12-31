\"use client\";

import { useMemo, useState } from \"react\";

type HistoryLog = {
  log_date: string;
  task_templates: { title: string; category: string } | null;
};

type CalendarDay = {
  date: string;
  tasks: { title: string; category: string }[];
};

const weekdayLabels = [\"Sun\", \"Mon\", \"Tue\", \"Wed\", \"Thu\", \"Fri\", \"Sat\"];

const categoryColors: Record<string, string> = {
  Training: \"bg-orange-100 text-orange-700\",
  Creative: \"bg-red-100 text-red-700\",
  Health: \"bg-emerald-100 text-emerald-700\",
  Wellness: \"bg-emerald-100 text-emerald-700\",
  Personal: \"bg-sky-100 text-sky-700\",
  Work: \"bg-indigo-100 text-indigo-700\",
};

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, \"0\");
  const day = `${date.getDate()}`.padStart(2, \"0\");
  return `${year}-${month}-${day}`;
};

const buildCalendarDays = (year: number, month: number) => {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(monthStart.getDate() - monthStart.getDay());
  const calendarEnd = new Date(monthEnd);
  calendarEnd.setDate(monthEnd.getDate() + (6 - monthEnd.getDay()));

  const days: Date[] = [];
  for (
    let cursor = new Date(calendarStart);
    cursor <= calendarEnd;
    cursor.setDate(cursor.getDate() + 1)
  ) {
    days.push(new Date(cursor));
  }
  return days;
};

const buildCalendarMap = (logs: HistoryLog[]) => {
  const calendarMap = new Map<string, CalendarDay>();
  logs.forEach((row) => {
    if (!calendarMap.has(row.log_date)) {
      calendarMap.set(row.log_date, { date: row.log_date, tasks: [] });
    }
    if (row.task_templates) {
      calendarMap.get(row.log_date)!.tasks.push({
        title: row.task_templates.title,
        category: row.task_templates.category,
      });
    }
  });
  return calendarMap;
};

export default function HistoryView({
  logs,
  month,
  year,
  monthLabel,
}: {
  logs: HistoryLog[];
  month: number;
  year: number;
  monthLabel: string;
}) {
  const [view, setView] = useState<\"calendar\" | \"list\">(\"calendar\");
  const todayKey = formatDateKey(new Date());

  const calendarDays = useMemo(
    () => buildCalendarDays(year, month),
    [year, month],
  );
  const calendarMap = useMemo(() => buildCalendarMap(logs), [logs]);

  const listDates = useMemo(() => {
    const sorted = Array.from(calendarMap.keys()).sort((a, b) =>
      a.localeCompare(b),
    );
    return sorted;
  }, [calendarMap]);

  return (
    <div className=\"space-y-4\">
      <div className=\"flex flex-wrap items-center justify-between gap-3\">
        <div className=\"space-y-1\">
          <h1 className=\"text-2xl font-semibold\">Completed Tasks</h1>
          <p className=\"text-sm text-gray-600\">{monthLabel}</p>
        </div>
        <div className=\"flex items-center gap-2 rounded-full border bg-white p-1 text-sm\">
          <button
            type=\"button\"
            onClick={() => setView(\"calendar\")}
            className={`rounded-full px-4 py-1.5 font-medium transition ${
              view === \"calendar\"
                ? \"bg-black text-white\"
                : \"text-gray-600 hover:text-gray-900\"
            }`}
          >
            Calendar
          </button>
          <button
            type=\"button\"
            onClick={() => setView(\"list\")}
            className={`rounded-full px-4 py-1.5 font-medium transition ${
              view === \"list\"
                ? \"bg-black text-white\"
                : \"text-gray-600 hover:text-gray-900\"
            }`}
          >
            List
          </button>
        </div>
      </div>

      {view === \"calendar\" ? (
        <div className=\"rounded-xl border bg-white shadow-sm\">
          <div className=\"grid grid-cols-7 border-b bg-zinc-50 text-sm font-medium text-zinc-600\">
            {weekdayLabels.map((label) => (
              <div key={label} className=\"px-3 py-2 text-left\">
                {label}
              </div>
            ))}
          </div>
          <div className=\"grid grid-cols-7\">
            {calendarDays.map((date) => {
              const dateKey = formatDateKey(date);
              const entry = calendarMap.get(dateKey);
              const inCurrentMonth = date.getMonth() === month;
              const isToday = dateKey === todayKey;
              return (
                <div
                  key={dateKey}
                  className={`min-h-[140px] border-b border-r px-3 py-3 text-sm last:border-r-0 ${
                    inCurrentMonth ? \"bg-white\" : \"bg-zinc-50\"
                  }`}
                >
                  <div className=\"flex items-center justify-between\">
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                        isToday
                          ? \"bg-emerald-500 text-white\"
                          : inCurrentMonth
                          ? \"text-zinc-900\"
                          : \"text-zinc-400\"
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {entry?.tasks.length ? (
                      <span className=\"text-xs font-medium text-zinc-500\">
                        {entry.tasks.length}
                      </span>
                    ) : null}
                  </div>
                  <div className=\"mt-2 space-y-1\">
                    {entry?.tasks.length ? (
                      entry.tasks.slice(0, 4).map((task, idx) => (
                        <div
                          key={`${dateKey}-${idx}`}
                          className={`truncate rounded-full px-2 py-1 text-xs font-medium ${
                            categoryColors[task.category] ??
                            \"bg-gray-100 text-gray-700\"
                          }`}
                        >
                          {task.title}
                        </div>
                      ))
                    ) : (
                      <p className=\"text-xs text-zinc-400\">
                        No completed tasks
                      </p>
                    )}
                    {entry && entry.tasks.length > 4 ? (
                      <p className=\"text-xs font-medium text-zinc-500\">
                        +{entry.tasks.length - 4} more
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : listDates.length === 0 ? (
        <p className=\"text-gray-600\">No completed tasks yet.</p>
      ) : (
        <div className=\"space-y-4\">
          {listDates.map((date) => {
            const entry = calendarMap.get(date);
            if (!entry) return null;
            return (
              <section key={date} className=\"rounded border p-4 space-y-2\">
                <div className=\"flex items-center justify-between\">
                  <div className=\"font-semibold\">{date}</div>
                  <div className=\"text-sm text-gray-600\">
                    {entry.tasks.length} completed
                  </div>
                </div>
                <ul className=\"space-y-1\">
                  {entry.tasks.map((task, idx) => (
                    <li key={idx} className=\"text-sm flex justify-between\">
                      <span>
                        {task.title}{" "}
                        <span className=\"text-gray-500\">({task.category})</span>
                      </span>
                      <span>✅</span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
