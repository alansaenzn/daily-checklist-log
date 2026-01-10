"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArchiveDailyTaskEntry } from "@/types/archive";
import { TaskDetailsPreview } from "@/components/TaskDetailsPreview";

type ArchiveDailyWindowProps = {
  data: Record<string, ArchiveDailyTaskEntry[]>;
  rangeStart: string;
  rangeEnd: string;
  onLoadMorePast: () => Promise<boolean>;
  loadingPast: boolean;
  hasMorePast: boolean;
  focusDateKey: string;
};

const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateKey = (iso: string): Date => {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
};

const formatTime = (timestamp: string | null): string | null => {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

const formatShortTime = (date: Date) =>
  date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

const formatHourLabel = (hour: number) => {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
};

type ActivityLevel = "Low" | "Medium" | "High" | "Peak";

const activityLevelForDuration = (durationMinutes: number): ActivityLevel => {
  if (durationMinutes >= 120) return "Peak";
  if (durationMinutes >= 70) return "High";
  if (durationMinutes >= 30) return "Medium";
  return "Low";
};

const pillClasses = (level: ActivityLevel) => {
  switch (level) {
    case "Low":
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200";
    case "Medium":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
    case "High":
      return "bg-emerald-600 text-white dark:bg-emerald-500";
    case "Peak":
      return "bg-amber-500 text-white dark:bg-amber-400 dark:text-gray-900";
  }
};

const barClasses = (level: ActivityLevel) => {
  switch (level) {
    case "Low":
      return "bg-gray-300/70 dark:bg-gray-700";
    case "Medium":
      return "bg-emerald-200 dark:bg-emerald-900/60";
    case "High":
      return "bg-emerald-400 dark:bg-emerald-500/70";
    case "Peak":
      return "bg-amber-300 dark:bg-amber-400/70";
  }
};

const inferDurationMinutes = (task: ArchiveDailyTaskEntry) => {
  const title = (task.title || "").toLowerCase();
  const category = (task.category || "").toLowerCase();
  const isRecurring = task.task_type === "recurring";

  if (isRecurring || title.includes("habit") || category.includes("habit")) return 15;
  if (title.includes("routine") || category.includes("routine")) return 45;
  if (title.includes("work") || category.includes("work") || title.includes("project")) return 90;
  if (title.includes("gym") || category.includes("fitness") || title.includes("run")) return 60;
  return 30;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

const overlapCardClasses = [
  "translate-x-0 scale-[1] opacity-100 mt-0",
  "translate-x-2 scale-[0.99] opacity-[0.94] -mt-2",
  "translate-x-4 scale-[0.98] opacity-[0.88] -mt-2",
  "translate-x-6 scale-[0.97] opacity-[0.82] -mt-2",
];

const barWidthClasses = [
  "w-0",
  "w-[10%]",
  "w-[20%]",
  "w-[30%]",
  "w-[40%]",
  "w-[50%]",
  "w-[60%]",
  "w-[70%]",
  "w-[80%]",
  "w-[90%]",
  "w-[100%]",
];

const ArchiveDailyWindow: React.FC<ArchiveDailyWindowProps> = ({
  data,
  rangeStart,
  rangeEnd,
  onLoadMorePast,
  loadingPast,
  hasMorePast,
  focusDateKey,
}) => {
  const [openTaskKey, setOpenTaskKey] = useState<string | null>(null);
  const [showOnlyCompleted, setShowOnlyCompleted] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const longPressKeyRef = useRef<string | null>(null);
  const longPressTimeoutRef = useRef<number | null>(null);

  const dateKeys = useMemo(() => {
    const startDate = parseDateKey(rangeStart);
    const endDate = parseDateKey(rangeEnd);
    const cursor = new Date(endDate);
    const days: string[] = [];

    cursor.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);

    while (cursor >= startDate) {
      days.push(formatDateKey(cursor));
      cursor.setDate(cursor.getDate() - 1);
    }

    return days;
  }, [rangeStart, rangeEnd]);

  const selectedDateKey = useMemo(() => {
    if (focusDateKey && dateKeys.includes(focusDateKey)) return focusDateKey;
    return dateKeys[0] ?? "";
  }, [dateKeys, focusDateKey]);

  useEffect(() => {
    if (!focusDateKey) return;

    const activeIndex = dateKeys.indexOf(focusDateKey);
    if (activeIndex === -1) {
      // If user navigated outside the loaded range, attempt to pull more past data.
      if (focusDateKey < rangeStart && hasMorePast && !loadingPast) {
        void onLoadMorePast();
      }
    }
  }, [focusDateKey, dateKeys, hasMorePast, loadingPast, onLoadMorePast, rangeStart]);

  const todayKey = formatDateKey(new Date());

  const selectedDate = useMemo(() => (selectedDateKey ? parseDateKey(selectedDateKey) : null), [selectedDateKey]);

  const allTasksForDay = useMemo(() => {
    if (!selectedDateKey) return [];
    return (data[selectedDateKey] || []).slice();
  }, [data, selectedDateKey]);

  const completedCount = useMemo(
    () => allTasksForDay.filter((t) => Boolean(t.completed_at)).length,
    [allTasksForDay]
  );

  const timelineStartHour = 0;
  const timelineEndHour = 23;

  type TimelineTask = {
    key: string;
    task: ArchiveDailyTaskEntry;
    start: Date | null;
    end: Date | null;
    durationMinutes: number;
    activity: ActivityLevel;
    hourBucket: number | "all-day";
    startMinutesOfHour: number;
  };

  const timelineTasks = useMemo(() => {
    const filtered = showOnlyCompleted
      ? allTasksForDay.filter((t) => Boolean(t.completed_at))
      : allTasksForDay;

    return filtered
      .map((task, idx): TimelineTask => {
        const durationMinutes = inferDurationMinutes(task);
        const activity = activityLevelForDuration(durationMinutes);

        let start: Date | null = null;
        let end: Date | null = null;
        if (task.completed_at) {
          end = new Date(task.completed_at);
          if (Number.isNaN(end.getTime())) {
            end = null;
          }
        }

        if (end) {
          start = new Date(end.getTime() - durationMinutes * 60_000);
        }

        const endHour = end ? end.getHours() : null;
        let hourBucket: number | "all-day";
        if (endHour !== null) {
          hourBucket = clamp(endHour, timelineStartHour, timelineEndHour);
        } else {
          const bucketHourRaw = start ? start.getHours() : null;
          hourBucket = bucketHourRaw === null ? "all-day" : clamp(bucketHourRaw, timelineStartHour, timelineEndHour);
        }

        const startMinutesOfHour = end ? end.getMinutes() : start ? start.getMinutes() : 0;

        return {
          key: `${selectedDateKey}-task-${idx}`,
          task,
          start,
          end,
          durationMinutes,
          activity,
          hourBucket,
          startMinutesOfHour,
        };
      })
      .sort((a, b) => {
        if (a.hourBucket === "all-day" && b.hourBucket !== "all-day") return -1;
        if (a.hourBucket !== "all-day" && b.hourBucket === "all-day") return 1;
        if (a.hourBucket === "all-day" && b.hourBucket === "all-day") return a.task.title.localeCompare(b.task.title);
        return (
          (a.hourBucket as number) - (b.hourBucket as number) ||
          a.startMinutesOfHour - b.startMinutesOfHour ||
          a.task.title.localeCompare(b.task.title)
        );
      });
  }, [allTasksForDay, selectedDateKey, showOnlyCompleted]);

  const tasksByBucket = useMemo(() => {
    const buckets = new Map<number | "all-day", TimelineTask[]>();
    const ensure = (key: number | "all-day") => {
      if (!buckets.has(key)) buckets.set(key, []);
      return buckets.get(key)!;
    };

    timelineTasks.forEach((t) => {
      ensure(t.hourBucket).push(t);
    });

    buckets.forEach((arr, key) => {
      if (key === "all-day") return;
      arr.sort((a, b) => a.startMinutesOfHour - b.startMinutesOfHour);
    });

    return buckets;
  }, [timelineTasks]);

  const hours = useMemo(
    () => Array.from({ length: timelineEndHour - timelineStartHour + 1 }, (_, i) => timelineStartHour + i),
    []
  );

  const isToday = selectedDateKey === todayKey;
  const handleLongPressStart = (taskKey: string, pointerType: string) => {
    if (pointerType !== "touch" && pointerType !== "pen") return;
    longPressKeyRef.current = taskKey;
    if (longPressTimeoutRef.current !== null) {
      window.clearTimeout(longPressTimeoutRef.current);
    }
    longPressTimeoutRef.current = window.setTimeout(() => {
      if (longPressKeyRef.current === taskKey) {
        setRevealedKey(taskKey);
      }
    }, 450);
  };

  const handleLongPressEnd = () => {
    longPressKeyRef.current = null;
    if (longPressTimeoutRef.current !== null) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (longPressTimeoutRef.current !== null) {
        window.clearTimeout(longPressTimeoutRef.current);
      }
    };
  }, []);

  const renderTaskCard = (t: TimelineTask, indexInBucket: number, bucketTasks: TimelineTask[]) => {
    const { task, key, start, end, durationMinutes, activity } = t;
    const isOpen = openTaskKey === key;

    const endMs = end ? end.getTime() : null;
    const overlapsPrev =
      indexInBucket > 0 &&
      bucketTasks[indexInBucket - 1].end &&
      start &&
      endMs !== null &&
      start.getTime() < (bucketTasks[indexInBucket - 1].end as Date).getTime();

    const overlapIndex = overlapsPrev ? Math.min(indexInBucket, 3) : 0;
    const completedTime = task.completed_at ? formatTime(task.completed_at) : null;
    const timeRange = start && end ? `${formatShortTime(start)} – ${formatShortTime(end)}` : null;
    const showReveal = revealedKey === key;

    const normalized = Math.min(durationMinutes / 120, 1);
    const barWidthIndex = Math.min(Math.max(Math.round(normalized * 10), 0), 10);
    const barWidthClass = barWidthClasses[barWidthIndex] ?? "w-0";
    const overlapClass = overlapCardClasses[overlapIndex] ?? overlapCardClasses[0];

    return (
      <div key={key} className={`relative z-0 ${overlapClass}`}>
        <button
          type="button"
          className={`w-full rounded-2xl bg-white px-4 py-3 text-left shadow-sm transition-[transform,opacity,background-color] duration-200 dark:bg-gray-950 ${
            isOpen ? "ring-1 ring-gray-200 dark:ring-gray-800" : ""
          }`}
          onClick={() => setOpenTaskKey(isOpen ? null : key)}
          onPointerDown={(e) => handleLongPressStart(key, e.pointerType)}
          onPointerUp={handleLongPressEnd}
          onPointerCancel={handleLongPressEnd}
          aria-expanded={isOpen ? "true" : "false"}
          aria-controls={isOpen ? `${key}-details` : undefined}
          aria-label={`${task.title}${task.category ? `, ${task.category}` : ""}${completedTime ? `, completed at ${completedTime}` : ""}`}
        >
          <div className="grid grid-cols-[1fr_auto] items-start gap-3">
            <div className="min-w-0">
              <div className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">{task.title}</div>
              {task.category && (
                <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">{task.category}</div>
              )}
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                {timeRange ? timeRange : completedTime ? `Completed ${completedTime}` : "Not completed"}
              </div>
              {showReveal && (
                <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 tabular-nums">
                  Duration: {durationMinutes} min{completedTime ? ` • Completed: ${completedTime}` : ""}
                </div>
              )}
            </div>
            <span
              className={`inline-flex min-h-[28px] items-center rounded-full px-3 text-xs font-semibold transition-colors duration-200 ${pillClasses(
                activity
              )}`}
              aria-label={`Activity level: ${activity}`}
            >
              {activity}
            </span>
          </div>

          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800" aria-hidden="true">
            <div
              className={`h-full rounded-full transition-[width] duration-200 ${barClasses(activity)} ${barWidthClass}`}
            />
          </div>
          <div className="sr-only" aria-label={`Duration bar: approximately ${durationMinutes} minutes`} />
        </button>

        <div className="mt-2">
          <TaskDetailsPreview
            id={`${key}-details`}
            isOpen={isOpen}
            category={task.category}
            taskType={task.task_type ?? "one_off"}
            notes={task.notes ?? null}
            details={task.details ?? null}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-24 md:pb-28">
      {selectedDate && (
        <div
          className={`rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-950 ${isToday ? "ring-1 ring-gray-200 dark:ring-gray-800" : ""}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">{selectedDate.toLocaleDateString("en-US", { weekday: "long" })}</div>
              <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">{selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 tabular-nums">
                <span className="font-semibold text-gray-900 dark:text-gray-100">{completedCount}</span> completed
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Show only completed</div>
              <button
                type="button"
                role="switch"
                aria-checked={showOnlyCompleted ? "true" : "false"}
                aria-label="Show only completed"
                onClick={() => setShowOnlyCompleted((v) => !v)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200 ${
                  showOnlyCompleted ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-800"
                }`}
              >
                <span
                  className={`inline-block h-7 w-7 transform rounded-full bg-white shadow-sm transition-transform duration-200 dark:bg-gray-100 ${
                    showOnlyCompleted ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {loadingPast && (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" aria-hidden />
          Loading older activity…
        </div>
      )}

      {dateKeys.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
          No days to show yet.
        </div>
      ) : (
        <div className="rounded-2xl bg-white shadow-sm dark:bg-gray-950 overflow-hidden">
          <div className="relative">
            <div className="absolute left-20 top-0 bottom-0 border-l border-gray-200 dark:border-gray-800" aria-hidden />

            {/* All-day row */}
            <div
              className="flex min-h-[64px] gap-4 border-b border-gray-100 px-4 py-4 dark:border-gray-900"
              aria-label="All-day timeline row"
            >
              <div className="w-16 text-right text-xs font-semibold text-gray-500 dark:text-gray-500">All day</div>
              <div className="flex-1 pl-2">
                <div className="flex flex-col gap-3">
                  {(tasksByBucket.get("all-day") ?? []).length === 0 ? (
                    <div className="flex h-full items-center text-xs text-gray-400 dark:text-gray-600">—</div>
                  ) : (
                    (tasksByBucket.get("all-day") ?? []).map((t, idx) => renderTaskCard(t, idx, tasksByBucket.get("all-day") ?? []))
                  )}
                </div>
              </div>
            </div>


            {hours.map((hour) => {
              const bucket = tasksByBucket.get(hour) ?? [];
              const displayHour = formatHourLabel(hour);

              return (
                <div
                  key={`${selectedDateKey}-hour-${hour}`}
                  className="flex min-h-[72px] gap-4 border-b border-gray-100 px-4 py-4 dark:border-gray-900 last:border-b-0"
                  aria-label={`Timeline hour ${displayHour}`}
                >
                  <div className="w-16 text-right text-xs font-semibold text-gray-500 dark:text-gray-500">{displayHour}</div>
                  <div className="flex-1 pl-2">
                    <div className="flex flex-col gap-3">
                      {bucket.length === 0 ? (
                        <div className="flex h-full items-center text-xs text-gray-400 dark:text-gray-600">—</div>
                      ) : (
                        bucket.map((t, idx) => renderTaskCard(t, idx, bucket))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loadingPast && !hasMorePast && dateKeys.length > 0 && selectedDateKey === dateKeys[dateKeys.length - 1] && (
        <p className="text-center text-xs text-gray-500 dark:text-gray-400">You have reached the start of your archive.</p>
      )}
    </div>
  );
};

export default ArchiveDailyWindow;
