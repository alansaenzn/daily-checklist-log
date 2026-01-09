/**
 * CalendarTabView Component
 * 
 * Read-only preview of scheduled tasks (tasks with due_date set).
 * Shows today through the next 7 days, grouped by date.
 * Not a full planner - just a lightweight view of upcoming scheduled tasks.
 */

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createTaskTemplate } from "@/app/actions/tasks";

export interface ScheduledTask {
  id: string;
  title: string;
  category: string;
  due_date: string;
  due_time: string | null;
}

export interface TimelineSourceTask {
  id: string;
  title: string;
  category: string | null;
  project_id: string | null;
  due_date: string | null;
  due_time: string | null;
  created_at: string | null;
  task_type: "recurring" | "one_off";
  recurrence_interval_days: number | null;
}

interface CalendarTabViewProps {
  scheduledTasks: ScheduledTask[];
  timelineTasks: TimelineSourceTask[];
  projectLookup: Record<string, string>;
}

type CalendarView = "scheduled" | "timeline";
type TimelineRange = 7 | 14 | 30;

type TimelineOccurrence = {
  instanceKey: string;
  id: string;
  title: string;
  category: string;
  project_id: string | null;
  project_label: string | null;
  date: string;
  due_time: string | null;
  is_recurring: boolean;
  recurrence_interval_days: number | null;
};

type TimelineRow = {
  key: string;
  label: string;
  type: "project" | "category";
  tasksByDate: Record<string, TimelineOccurrence[]>;
};

export function CalendarTabView({
  scheduledTasks,
  timelineTasks,
  projectLookup,
}: CalendarTabViewProps) {
  const router = useRouter();
  const [activeView, setActiveView] = useState<CalendarView>("scheduled");
  const [timelineRange, setTimelineRange] = useState<TimelineRange>(7);
  const [timelineStartDate, setTimelineStartDate] = useState(() => startOfDay(new Date()));
  const timelineMinStart = useMemo(() => startOfDay(new Date()), []);
  const timelineMaxStart = useMemo(
    () => addDays(timelineMinStart, Math.max(0, 30 - timelineRange)),
    [timelineMinStart, timelineRange]
  );

  const tasksByDate = useMemo(
    () => groupScheduledTasksByDate(scheduledTasks),
    [scheduledTasks]
  );

  const scheduledRange = useMemo(() => getNextDays(startOfDay(new Date()), 7), []);
  const [addingForDate, setAddingForDate] = useState<string | null>(null);

  const dateRange = useMemo(
    () => getNextDays(timelineStartDate, timelineRange),
    [timelineStartDate, timelineRange]
  );

  const timelineRows = useMemo(() => {
    const occurrences = buildTimelineOccurrences(timelineTasks, dateRange, projectLookup);
    return groupTimelineByRow(occurrences);
  }, [timelineTasks, dateRange, projectLookup]);

  useEffect(() => {
    if (timelineStartDate < timelineMinStart) {
      setTimelineStartDate(timelineMinStart);
      return;
    }
    if (timelineStartDate > timelineMaxStart) {
      setTimelineStartDate(timelineMaxStart);
    }
  }, [timelineStartDate, timelineMinStart, timelineMaxStart]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <p className="text-xs uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wide">
          Preview
        </p>
        <h2 className="text-3xl font-black uppercase tracking-tight">
          Scheduled Tasks
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {activeView === "scheduled"
            ? "Tasks with due dates set. Read-only preview of your upcoming schedule."
            : "Recurring cadence preview for upcoming days."}
        </p>
      </div>

      <div className="flex gap-3 border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setActiveView("scheduled")}
          className={`pb-2 text-xs font-bold uppercase tracking-wide transition-colors relative ${
            activeView === "scheduled"
              ? "text-blue-600 dark:text-blue-500"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          Scheduled
          {activeView === "scheduled" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-500" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveView("timeline")}
          className={`pb-2 text-xs font-bold uppercase tracking-wide transition-colors relative ${
            activeView === "timeline"
              ? "text-blue-600 dark:text-blue-500"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          Timeline
          {activeView === "timeline" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-500" />
          )}
        </button>
      </div>

      {activeView === "scheduled" ? (
        <div className="space-y-4">
          {scheduledRange.map((dateInfo) => {
            const tasks = tasksByDate[dateInfo.isoDate] || [];
            const hasTasks = tasks.length > 0;

            return (
              <div
                key={dateInfo.isoDate}
                className={`rounded-xl border transition-colors ${
                  hasTasks
                    ? "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                    : "bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800"
                }`}
              >
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                        {dateInfo.dayName}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {dateInfo.dateLabel}
                      </p>
                    </div>
                    {hasTasks && (
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  {hasTasks ? (
                    <div className="space-y-2">
                      {tasks.map((task) => (
                        <TaskCard key={task.id} task={task} />
                      ))}
                      <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                        <form
                          action={async (formData) => {
                            try {
                              setAddingForDate(dateInfo.isoDate);
                              // Ensure required fields
                              const title = String(formData.get("title") || "").trim();
                              if (!title) return;
                              formData.set("due_date", dateInfo.isoDate);
                              await createTaskTemplate(formData);
                              setAddingForDate(null);
                              router.refresh();
                            } catch (err) {
                              console.error("Failed to add scheduled task:", err);
                              setAddingForDate(null);
                            }
                          }}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="text"
                            name="title"
                            placeholder="Add a task for this day..."
                            maxLength={200}
                            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            aria-label={`New task title for ${dateInfo.dateLabel}`}
                            required
                            disabled={addingForDate === dateInfo.isoDate}
                          />
                          <input
                            type="time"
                            name="due_time"
                            className="rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            aria-label="Due time (optional)"
                            disabled={addingForDate === dateInfo.isoDate}
                          />
                          <button
                            type="submit"
                            disabled={addingForDate === dateInfo.isoDate}
                            className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {addingForDate === dateInfo.isoDate ? "Adding..." : "Add Task"}
                          </button>
                        </form>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-500 dark:text-gray-500 text-center py-2">
                        No scheduled tasks
                      </p>
                      <div className="max-w-xl mx-auto">
                        <form
                          action={async (formData) => {
                            try {
                              setAddingForDate(dateInfo.isoDate);
                              const title = String(formData.get("title") || "").trim();
                              if (!title) return;
                              formData.set("due_date", dateInfo.isoDate);
                              await createTaskTemplate(formData);
                              setAddingForDate(null);
                              router.refresh();
                            } catch (err) {
                              console.error("Failed to add scheduled task:", err);
                              setAddingForDate(null);
                            }
                          }}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="text"
                            name="title"
                            placeholder="Schedule a task for this day..."
                            maxLength={200}
                            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            aria-label={`New task title for ${dateInfo.dateLabel}`}
                            required
                            disabled={addingForDate === dateInfo.isoDate}
                          />
                          <input
                            type="time"
                            name="due_time"
                            className="rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            aria-label="Due time (optional)"
                            disabled={addingForDate === dateInfo.isoDate}
                          />
                          <button
                            type="submit"
                            disabled={addingForDate === dateInfo.isoDate}
                            className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {addingForDate === dateInfo.isoDate ? "Adding..." : "Add Task"}
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  shiftTimelineRange(
                    -1,
                    timelineRange,
                    timelineStartDate,
                    timelineMinStart,
                    timelineMaxStart,
                    setTimelineStartDate
                  )
                }
                className="h-8 w-8 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Previous range"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() =>
                  shiftTimelineRange(
                    1,
                    timelineRange,
                    timelineStartDate,
                    timelineMinStart,
                    timelineMaxStart,
                    setTimelineStartDate
                  )
                }
                className="h-8 w-8 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Next range"
              >
                →
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {dateRange[0]?.dateLabel} – {dateRange[dateRange.length - 1]?.dateLabel}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {[7, 14, 30].map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setTimelineRange(range as TimelineRange)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide border ${
                    timelineRange === range
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {range} days
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="overflow-x-auto">
              <div
                className="grid text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400"
                style={{
                  gridTemplateColumns: `minmax(140px, 180px) repeat(${dateRange.length}, minmax(120px, 1fr))`,
                }}
              >
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  Rows
                </div>
                {dateRange.map((dateInfo) => (
                  <div
                    key={dateInfo.isoDate}
                    className="px-3 py-3 border-b border-gray-100 dark:border-gray-800 text-center"
                  >
                    <div className="text-[10px] text-gray-400 dark:text-gray-500">{dateInfo.dayShort}</div>
                    <div className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                      {dateInfo.dateShort}
                    </div>
                  </div>
                ))}
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {timelineRows.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-500">
                    No upcoming tasks
                  </div>
                ) : (
                  timelineRows.map((row) => (
                    <div
                      key={row.key}
                      className="grid"
                      style={{
                        gridTemplateColumns: `minmax(140px, 180px) repeat(${dateRange.length}, minmax(120px, 1fr))`,
                      }}
                    >
                      <div className="px-4 py-4 text-sm font-semibold text-gray-900 dark:text-white border-r border-gray-100 dark:border-gray-800">
                        <div className="truncate">{row.label}</div>
                        <div className="text-xs font-normal text-gray-500 dark:text-gray-400">
                          {row.type === "project" ? "Project" : "Category"}
                        </div>
                      </div>
                      {dateRange.map((dateInfo) => {
                        const tasks = row.tasksByDate[dateInfo.isoDate] || [];
                        return (
                          <div
                            key={`${row.key}-${dateInfo.isoDate}`}
                            className="px-2 py-3 border-r border-gray-100 dark:border-gray-800 min-h-[72px]"
                          >
                            <div className="space-y-2">
                              {tasks.map((task) => (
                                <TimelineTaskCard key={task.instanceKey} task={task} />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <Link
          href="/archive"
          className="flex items-center justify-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          <span>View Full Archive</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: ScheduledTask }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
      <div className="flex-shrink-0 w-16 pt-0.5">
        {task.due_time ? (
          <span className="text-xs font-semibold text-gray-900 dark:text-white">
            {formatTime(task.due_time)}
          </span>
        ) : (
          <span className="text-xs text-gray-400 dark:text-gray-600">All day</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug">
          {task.title}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
          {task.category}
        </p>
      </div>
    </div>
  );
}

function TimelineTaskCard({ task }: { task: TimelineOccurrence }) {
  const interval = task.recurrence_interval_days ?? 1;
  const repeatLabel = task.is_recurring ? (interval === 1 ? "Daily" : `Every ${interval}d`) : null;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
      <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
        {task.title}
      </p>
      <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {repeatLabel && <span>{repeatLabel}</span>}
        {task.project_label && <span className="rounded-full border border-gray-200 dark:border-gray-700 px-2 py-0.5">
          {task.project_label}
        </span>}
      </div>
    </div>
  );
}

function groupScheduledTasksByDate(tasks: ScheduledTask[]): Record<string, ScheduledTask[]> {
  const grouped: Record<string, ScheduledTask[]> = {};

  tasks.forEach((task) => {
    if (!grouped[task.due_date]) {
      grouped[task.due_date] = [];
    }
    grouped[task.due_date].push(task);
  });

  Object.keys(grouped).forEach((date) => {
    grouped[date].sort((a, b) => {
      if (a.due_time && !b.due_time) return -1;
      if (!a.due_time && b.due_time) return 1;

      if (a.due_time && b.due_time) {
        return a.due_time.localeCompare(b.due_time);
      }

      return a.title.localeCompare(b.title);
    });
  });

  return grouped;
}

function buildTimelineOccurrences(
  tasks: TimelineSourceTask[],
  dateRange: ReturnType<typeof getNextDays>,
  projectLookup: Record<string, string>
): TimelineOccurrence[] {
  const occurrences: TimelineOccurrence[] = [];
  const dateKeys = dateRange.map((date) => date.isoDate);
  const dateKeySet = new Set(dateKeys);

  tasks.forEach((task) => {
    const project_label = task.project_id ? projectLookup[task.project_id] || "Project" : null;
    const category = task.category || "Uncategorized";

    if (task.task_type === "recurring") {
      const interval = Math.max(1, task.recurrence_interval_days ?? 1);
      const anchorRaw = task.due_date || task.created_at;
      if (!anchorRaw) return;

      const anchorDate = new Date(anchorRaw);
      if (Number.isNaN(anchorDate.getTime())) return;

      const anchorKey = formatDateKey(anchorDate);
      const anchorMs = dateKeyToUtcMs(anchorKey);

      // Expand recurrence occurrences for each visible day only.
      dateKeys.forEach((dateKey) => {
        if (!dateKeySet.has(dateKey)) return;
        const dateMs = dateKeyToUtcMs(dateKey);
        const diffDays = Math.floor((dateMs - anchorMs) / DAY_MS);
        if (diffDays < 0) return;
        if (diffDays % interval !== 0) return;

        occurrences.push({
          instanceKey: `${task.id}-${dateKey}`,
          id: task.id,
          title: task.title,
          category,
          project_id: task.project_id,
          project_label,
          date: dateKey,
          due_time: task.due_time,
          is_recurring: true,
          recurrence_interval_days: interval,
        });
      });
      return;
    }

    if (!task.due_date) return;
    if (!dateKeySet.has(task.due_date)) return;

    occurrences.push({
      instanceKey: `${task.id}-${task.due_date}`,
      id: task.id,
      title: task.title,
      category,
      project_id: task.project_id,
      project_label,
      date: task.due_date,
      due_time: task.due_time,
      is_recurring: false,
      recurrence_interval_days: null,
    });
  });

  return occurrences;
}

function groupTimelineByRow(occurrences: TimelineOccurrence[]): TimelineRow[] {
  const rows = new Map<string, TimelineRow>();

  occurrences.forEach((task) => {
    const rowType = task.project_id ? "project" : "category";
    const rowLabel = task.project_id ? task.project_label || "Project" : task.category;
    const key = `${rowType}-${rowLabel}`;

    if (!rows.has(key)) {
      rows.set(key, {
        key,
        label: rowLabel,
        type: rowType,
        tasksByDate: {},
      });
    }

    const row = rows.get(key)!;
    if (!row.tasksByDate[task.date]) {
      row.tasksByDate[task.date] = [];
    }
    row.tasksByDate[task.date].push(task);
  });

  rows.forEach((row) => {
    Object.keys(row.tasksByDate).forEach((date) => {
      row.tasksByDate[date].sort((a, b) => {
        if (a.due_time && !b.due_time) return -1;
        if (!a.due_time && b.due_time) return 1;
        if (a.due_time && b.due_time) {
          return a.due_time.localeCompare(b.due_time);
        }
        return a.title.localeCompare(b.title);
      });
    });
  });

  return Array.from(rows.values()).sort((a, b) => a.label.localeCompare(b.label));
}

function getNextDays(startDate: Date, range: TimelineRange) {
  const result = [];

  for (let i = 0; i < range; i++) {
    const date = addDays(startDate, i);
    const isoDate = formatDateKey(date);

    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    const dayShort = date.toLocaleDateString("en-US", { weekday: "short" });
    const dateLabel = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const dateShort = date.toLocaleDateString("en-US", { day: "numeric" });

    let displayDayName = dayName;
    if (i === 0) {
      displayDayName = "Today";
    } else if (i === 1) {
      displayDayName = "Tomorrow";
    }

    result.push({
      isoDate,
      dayName: displayDayName,
      dateLabel,
      dayShort,
      dateShort,
    });
  }

  return result;
}

function shiftTimelineRange(
  direction: -1 | 1,
  range: TimelineRange,
  current: Date,
  min: Date,
  max: Date,
  onChange: (next: Date) => void
) {
  const next = addDays(current, direction * range);
  if (next < min) {
    onChange(min);
    return;
  }
  if (next > max) {
    onChange(max);
    return;
  }
  onChange(next);
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(date.getDate() + days);
  return next;
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function dateKeyToUtcMs(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${period}`;
}
