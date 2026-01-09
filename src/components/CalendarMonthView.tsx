"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { getColorClass, getTextColorClass } from "@/lib/heatmap-color-utils";

type CalendarDayTask = {
  title: string;
  category: string;
  completed_at: string | null;
  isScheduled?: boolean;
};

type CategoryFilter = "All" | "Fitness" | "Work" | "Routine" | "Custom";

interface CalendarMonthViewProps {
  year: number;
  month: number; // 0-indexed (0 = January)
  data: Record<string, number>; // { 'YYYY-MM-DD': count of completed tasks }
  dailyData?: Record<string, CalendarDayTask[]>; // { 'YYYY-MM-DD': tasks (completed + scheduled) }
  scheduledData?: Record<string, number>; // { 'YYYY-MM-DD': count of scheduled tasks }
  criticalMissByDate?: Record<string, boolean>; // { 'YYYY-MM-DD': true if a critical habit was missed }
  onDayClick?: (date: Date, count: number) => void;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

// Monday-first index (Mon=0 ... Sun=6)
function getFirstDayOfWeekMondayStart(year: number, month: number) {
  const d = new Date(year, month, 1);
  return (d.getDay() + 6) % 7;
}

function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Compact weekday labels inspired by the reference
const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

const CATEGORY_FILTERS: CategoryFilter[] = ["All", "Fitness", "Work", "Routine", "Custom"];

const matchesFilter = (filter: CategoryFilter, category: string) => {
  if (filter === "All") return true;
  const cat = (category || "").toLowerCase();
  const token = filter.toLowerCase();
  if (filter === "Routine") return cat.includes("routine");
  if (filter === "Fitness") return cat.includes("fitness");
  if (filter === "Work") return cat.includes("work");
  if (filter === "Custom") return cat.includes("custom");
  return cat.includes(token);
};

const formatTooltipDate = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const getDominantCategory = (tasks: CalendarDayTask[]) => {
  const counts = new Map<string, number>();
  tasks.forEach((task) => {
    const cat = task.category || "";
    if (!cat) return;
    counts.set(cat, (counts.get(cat) ?? 0) + 1);
  });
  let best: string | null = null;
  let bestCount = 0;
  for (const [cat, count] of counts.entries()) {
    if (best === null || count > bestCount || (count === bestCount && cat.localeCompare(best) < 0)) {
      best = cat;
      bestCount = count;
    }
  }
  return best;
};

const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({
  year,
  month,
  data,
  dailyData = {},
  scheduledData = {},
  criticalMissByDate = {},
  onDayClick,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("All");
  const [activeTooltipKey, setActiveTooltipKey] = useState<string | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = getFirstDayOfWeekMondayStart(year, month);
  const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;

  const daysArray = Array.from({ length: totalCells }, (_, i) => {
    const day = i - firstDayOfWeek + 1;
    if (i < firstDayOfWeek || day > daysInMonth) return null;
    return day;
  });

  // Compute simple streak (consecutive days with activity up to current day)
  const { streakDays, streakActivities } = useMemo(() => {
    const today = new Date(
      year,
      month,
      new Date().getMonth() === month && new Date().getFullYear() === year
        ? new Date().getDate()
        : daysInMonth
    );
    let dCount = 0;
    let activityTotal = 0;
    for (let i = today.getDate(); i >= 1; i--) {
      const key = formatDateKey(year, month, i);
      const c = data[key] || 0;
      if (c > 0) {
        dCount++;
        activityTotal += c;
      } else {
        break;
      }
    }
    return { streakDays: dCount, streakActivities: activityTotal };
  }, [year, month, daysInMonth, data]);

  const { filteredCountsByDate, dominantByDate } = useMemo(() => {
    const counts: Record<string, number> = {};
    const dominant: Record<string, string | null> = {};

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDateKey(year, month, day);
      const items = dailyData[dateKey] ?? [];
      const completed = items.filter((item) => Boolean(item.completed_at));
      const filtered = completed.filter((item) => matchesFilter(categoryFilter, item.category));
      counts[dateKey] = filtered.length;
      dominant[dateKey] = getDominantCategory(filtered);
    }

    return { filteredCountsByDate: counts, dominantByDate: dominant };
  }, [categoryFilter, dailyData, daysInMonth, month, year]);

  useEffect(() => {
    if (!activeTooltipKey) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveTooltipKey(null);
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      const host = target?.closest?.("[data-calendar-day]") as HTMLElement | null;
      if (!host) {
        setActiveTooltipKey(null);
        return;
      }
      const key = host.getAttribute("data-calendar-day");
      if (key !== activeTooltipKey) setActiveTooltipKey(null);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [activeTooltipKey]);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current !== null) {
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Streak summary above the calendar */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-6">
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] text-zinc-500">Your Streak</span>
            <span className="text-sm font-bold">{Math.max(0, Math.floor(streakDays / 7))} Weeks</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] text-zinc-500">Streak Activities</span>
            <span className="text-sm font-bold">{streakActivities}</span>
          </div>
        </div>
      </div>

      {/* Category filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label="Category filter">
        {CATEGORY_FILTERS.map((filter) => {
          const isActive = filter === categoryFilter;
          return (
            <button
              key={filter}
              type="button"
              onClick={() => setCategoryFilter(filter)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:focus-visible:ring-blue-400/40 ${
                isActive
                  ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              }`}
              aria-pressed={isActive}
            >
              {filter}
            </button>
          );
        })}
      </div>

      {/* Header row: weekday labels */}
      <div className="calendar-weekdays grid grid-cols-7 mb-3 text-xs font-semibold text-center tracking-wide text-gray-500 dark:text-gray-400">
        {WEEKDAYS.map((wd, i) => (
          <div key={`${wd}-${i}`}>{wd}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-3">
        {daysArray.map((day, idx) => {
          if (!day) return <div key={idx} className="h-10 w-10" aria-hidden="true" />;
          const dateKey = formatDateKey(year, month, day);
          const rawCount = data[dateKey] || 0;
          const filteredCount = categoryFilter === "All" ? rawCount : (filteredCountsByDate[dateKey] || 0);
          const scheduledCount = scheduledData[dateKey] || 0;
          const dateObj = new Date(year, month, day);

          const hasScheduled = scheduledCount > 0;
          const colorClass = getColorClass(filteredCount);
          const textClass =
            filteredCount === 0
              ? "text-zinc-500 dark:text-zinc-400"
              : `${getTextColorClass(filteredCount)} dark:text-white`;
          const isActive = filteredCount > 0;
          // Keep the checkmark indicator independent of filters (based on total completion).
          const isAllDone = hasScheduled && rawCount >= scheduledCount && scheduledCount > 0;
          const showWarningDot = !!criticalMissByDate[dateKey];

          const tooltipId = `month-tooltip-${dateKey}`;
          const tooltipOpen = activeTooltipKey === dateKey;
          const dominantCategory = dominantByDate[dateKey] ?? null;
          const tooltipCount = filteredCount;
          const tooltipDate = formatTooltipDate(dateObj);

          const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
            if (longPressTimerRef.current !== null) {
              window.clearTimeout(longPressTimerRef.current);
              longPressTimerRef.current = null;
            }
            longPressTriggeredRef.current = false;

            if (e.pointerType === "touch" || e.pointerType === "pen") {
              longPressTimerRef.current = window.setTimeout(() => {
                longPressTriggeredRef.current = true;
                setActiveTooltipKey(dateKey);
              }, 450);
            }
          };

          const clearLongPress = () => {
            if (longPressTimerRef.current !== null) {
              window.clearTimeout(longPressTimerRef.current);
              longPressTimerRef.current = null;
            }
          };
          
          return (
            <button
              key={idx}
              data-calendar-day={dateKey}
              type="button"
              className={`group relative mx-auto flex h-10 w-10 items-center justify-center rounded-full ${colorClass} transition-colors duration-200 ${
                onDayClick ? "cursor-pointer" : "cursor-default"
              }`}
              onMouseEnter={() => setActiveTooltipKey(dateKey)}
              onMouseLeave={() => setActiveTooltipKey((prev) => (prev === dateKey ? null : prev))}
              onFocus={() => setActiveTooltipKey(dateKey)}
              onBlur={() => setActiveTooltipKey((prev) => (prev === dateKey ? null : prev))}
              onPointerDown={handlePointerDown}
              onPointerUp={clearLongPress}
              onPointerCancel={clearLongPress}
              onClick={() => {
                if (longPressTriggeredRef.current) {
                  longPressTriggeredRef.current = false;
                  return;
                }
                onDayClick?.(dateObj, rawCount);
              }}
              onKeyDown={(e) => {
                if (onDayClick && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onDayClick(dateObj, rawCount);
                }
              }}
              aria-label={`${tooltipDate}: ${filteredCount} ${filteredCount === 1 ? "task" : "tasks"} completed`}
              aria-describedby={tooltipOpen ? tooltipId : undefined}
            >
              <span className={`text-sm font-semibold ${textClass}`}>{day}</span>

              {/* Streak/Completion indicator (independent of filters) */}
              {isAllDone && (
                <span
                  className="absolute -top-1 -left-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-gray-900 shadow-sm dark:bg-gray-950 dark:text-gray-100"
                  aria-hidden="true"
                >
                  ✓
                </span>
              )}

              {/* Missed critical habit warning dot */}
              {showWarningDot && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-orange-500" aria-hidden="true" />
              )}

              {/* Tooltip */}
              {tooltipOpen && (
                <div
                  id={tooltipId}
                  role="tooltip"
                  className="absolute left-1/2 top-0 z-20 w-max -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition-opacity duration-200 dark:border-gray-800 dark:bg-gray-950"
                >
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{tooltipDate}</div>
                  <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {tooltipCount} {tooltipCount === 1 ? "task" : "tasks"} completed
                  </div>
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Dominant category: {dominantCategory ?? "—"}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarMonthView;
