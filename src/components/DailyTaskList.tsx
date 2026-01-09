import React from "react";

type DailyTaskEntry = {
  title: string;
  category: string;
  completed_at: string | null;
  isScheduled?: boolean; // New: indicates task is scheduled but not yet completed
};

interface DailyTaskListProps {
  year: number;
  month: number; // 0-indexed
  data: Record<string, DailyTaskEntry[]>;
}

const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatTime = (timestamp: string | null): string | null => {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

const DailyTaskList: React.FC<DailyTaskListProps> = ({ year, month, data }) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, idx) => idx + 1);

  return (
    <div className="w-full space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
          Daily View
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Completed and scheduled tasks grouped by day
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {days.map((day) => {
          const date = new Date(year, month, day);
          const dateKey = formatDateKey(date);
          const tasks = (data[dateKey] || []).slice().sort((a, b) => {
            // Sort completed tasks first, then scheduled
            if (a.isScheduled === b.isScheduled) return 0;
            return a.isScheduled ? 1 : -1;
          });
          
          const completedTasks = tasks.filter(t => !t.isScheduled);
          const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
          const formattedDate = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });

          return (
            <div
              key={dateKey}
              className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{dayName}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{formattedDate}</p>
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {completedTasks.length} {completedTasks.length === 1 ? "task" : "tasks"}
                </span>
              </div>

              {tasks.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">No activity</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {tasks.map((task, idx) => {
                    const completedTime = formatTime(task.completed_at);
                    const isScheduled = task.isScheduled ?? false;
                    
                    return (
                      <li
                        key={`${dateKey}-${idx}`}
                        className={`flex items-center justify-between gap-2 rounded-md px-2 py-1 ${
                          isScheduled
                            ? "border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50"
                            : "border border-gray-100 dark:border-gray-800"
                        }`}
                      >
                        <div>
                          <p className={`text-sm font-medium ${
                            isScheduled
                              ? "text-gray-600 dark:text-gray-300"
                              : "text-gray-900 dark:text-gray-100"
                          }`}>
                            {task.title}
                            {isScheduled && (
                              <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">
                                (scheduled)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {task.category}
                          </p>
                        </div>
                        {completedTime && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {completedTime}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DailyTaskList;
