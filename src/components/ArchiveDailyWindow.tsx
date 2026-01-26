"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Timeline from "@mui/lab/Timeline";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineDot from "@mui/lab/TimelineDot";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import Typography from "@mui/material/Typography";
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

const activityDotColor: Record<ActivityLevel, string> = {
  Low: "#9ca3af",
  Medium: "#10b981",
  High: "#059669",
  Peak: "#f59e0b",
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
  "mt-0",
  "mt-0",
  "mt-0",
  "mt-0",
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
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const longPressKeyRef = useRef<string | null>(null);
  const longPressTimeoutRef = useRef<number | null>(null);
  const taskRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
    return allTasksForDay
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
  }, [allTasksForDay, selectedDateKey]);

  const timelineRows = useMemo(() => {
    // Show all tasks with completed ones first (chronologically), then incomplete ones
    const completedTasks = timelineTasks
      .filter((t) => t.end)
      .sort((a, b) => (a.end as Date).getTime() - (b.end as Date).getTime());
    
    const incompleteTasks = timelineTasks
      .filter((t) => !t.end)
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
    
    return [...completedTasks, ...incompleteTasks];
  }, [timelineTasks]);

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

  const focusTaskCard = useCallback(
    (key: string) => {
      setOpenTaskKey(key);
      const el = taskRefs.current[key];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
      }
    },
    []
  );

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

    const completedTime = task.completed_at ? formatTime(task.completed_at) : null;
    const timeRange = start && end ? `${formatShortTime(start)} – ${formatShortTime(end)}` : null;
    const showReveal = revealedKey === key;

    const normalized = Math.min(durationMinutes / 120, 1);
    const barWidthIndex = Math.min(Math.max(Math.round(normalized * 10), 0), 10);
    const barWidthClass = barWidthClasses[barWidthIndex] ?? "w-0";

    return (
      <div
        key={key}
        ref={(el) => {
          taskRefs.current[key] = el;
        }}
        className="relative z-0"
      >
        <Accordion
          expanded={isOpen}
          onChange={() => setOpenTaskKey(isOpen ? null : key)}
          disableGutters
          square={false}
          elevation={0}
          className={`rounded-2xl border border-transparent bg-white shadow-sm transition-[transform,opacity,background-color] duration-200 dark:bg-gray-950 ${
            isOpen ? "ring-1 ring-gray-200 dark:ring-gray-800" : ""
          }`}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon className="text-gray-400" />}
            className="px-4 py-3"
            onPointerDown={(e) => handleLongPressStart(key, e.pointerType)}
            onPointerUp={handleLongPressEnd}
            onPointerCancel={handleLongPressEnd}
            aria-controls={`${key}-details`}
            aria-label={`${task.title}${task.category ? `, ${task.category}` : ""}${completedTime ? `, completed at ${completedTime}` : ""}`}
          >
            <div className="grid grid-cols-[1fr_auto] items-start gap-3 w-full">
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
          </AccordionSummary>

          <AccordionDetails className="px-4 pb-4 pt-1">
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800" aria-hidden="true">
              <div className={`h-full rounded-full transition-[width] duration-200 ${barClasses(activity)} ${barWidthClass}`} />
            </div>
            <div className="sr-only" aria-label={`Duration bar: approximately ${durationMinutes} minutes`} />

            <div className="mt-3">
              <TaskDetailsPreview
                id={`${key}-details`}
                isOpen={isOpen}
                category={task.category}
                taskType={task.task_type ?? "one_off"}
                notes={task.notes ?? null}
                details={task.details ?? null}
              />
            </div>
          </AccordionDetails>
        </Accordion>
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
        <div className="rounded-2xl bg-white shadow-sm dark:bg-gray-950 p-3 md:p-4">
          {timelineRows.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-gray-400 dark:text-gray-600">No tasks for this day.</div>
          ) : (
            <div className="space-y-4">
              {timelineRows.map((item, idx) => {
                const timeLabel = item.end ? formatShortTime(item.end) : item.start ? formatShortTime(item.start) : "—";
                const isFirst = idx === 0;
                const isLast = idx === timelineRows.length - 1;

                return (
                  <div key={item.key} className="grid grid-cols-[auto,1fr] items-start gap-2 md:gap-3">
                    <div className="relative flex w-10 flex-col items-center">
                      {!isFirst && <div className="flex-1 w-px bg-gray-200 dark:bg-gray-800 absolute top-0" style={{ height: "50%" }} aria-hidden />}
                      <div className="relative z-10 flex flex-col items-center gap-1">
                        <TimelineDot sx={{ backgroundColor: activityDotColor[item.activity], width: 8, height: 8, minWidth: 8, minHeight: 8 }} />
                        <div className="text-[11px] font-semibold text-gray-700 dark:text-gray-200">{timeLabel}</div>
                      </div>
                      {!isLast && <div className="flex-1 w-px bg-gray-200 dark:bg-gray-800 absolute bottom-0" style={{ height: "50%" }} aria-hidden />}
                    </div>

                    <div>
                      {renderTaskCard(item, idx, timelineRows)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!loadingPast && !hasMorePast && dateKeys.length > 0 && selectedDateKey === dateKeys[dateKeys.length - 1] && (
        <p className="text-center text-xs text-gray-500 dark:text-gray-400">You have reached the start of your archive.</p>
      )}
    </div>
  );
};

export default ArchiveDailyWindow;
