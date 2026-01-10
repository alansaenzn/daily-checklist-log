import React, { useMemo } from "react";
import { formatDateKey } from "@/lib/heatmap-date-utils";
import { getIntensityLevel } from "@/lib/heatmap-color-utils";
import type { IntensityThresholds } from "@/lib/user-settings";

interface WeeklyHeatmapProps {
  /** Start date of the week (Monday) */
  weekStart: Date;

  /** Aggregated task data: { "YYYY-MM-DD": count } */
  data: Record<string, number>;
  /** Optional callback when a day is clicked */
  onDayClick?: (date: Date, count: number) => void;
  intensityThresholds?: IntensityThresholds;
}

const WEEKDAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type TrendTone = "positive" | "neutral" | "negative";
type ActivityLevel = "Low" | "Medium" | "High" | "Peak";

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const formatShort = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

const formatLong = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const percentChange = (
  current: number,
  previous: number
): { label: string; tone: TrendTone; direction: "up" | "down" | "flat" } => {
  if (previous === 0) {
    if (current === 0) return { label: "0%", tone: "neutral", direction: "flat" };
    return { label: "—", tone: "neutral", direction: "flat" };
  }
  const raw = ((current - previous) / previous) * 100;
  const rounded = Math.round(raw);
  if (rounded === 0) return { label: "0%", tone: "neutral", direction: "flat" };
  const sign = rounded > 0 ? "+" : "";
  return {
    label: `${sign}${rounded}%`,
    tone: rounded > 0 ? "positive" : "negative",
    direction: rounded > 0 ? "up" : "down",
  };
};

const toneClasses = (tone: TrendTone) => {
  if (tone === "positive") return "text-emerald-600 dark:text-emerald-400";
  if (tone === "negative") return "text-red-600 dark:text-red-400";
  return "text-gray-500 dark:text-gray-400";
};

const arrowForDirection = (dir: "up" | "down" | "flat") => {
  if (dir === "up") return "↑";
  if (dir === "down") return "↓";
  return "";
};

const activityLevelForCounts = (
  count: number,
  weekMax: number,
  thresholds?: IntensityThresholds
): ActivityLevel => {
  if (thresholds) {
    const level = getIntensityLevel(count, thresholds);
    if (level === "peak") return "Peak";
    if (level === "high") return "High";
    if (level === "medium") return "Medium";
    return "Low";
  }
  if (weekMax <= 0) return "Low";
  if (count <= 0) return "Low";
  if (count === weekMax) return "Peak";
  const ratio = count / weekMax;
  if (ratio >= 0.66) return "High";
  if (ratio >= 0.33) return "Medium";
  return "Low";
};

const activityPillClasses = (level: ActivityLevel) => {
  switch (level) {
    case "Low":
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200";
    case "Medium":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
    case "High":
      return "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-white";
    case "Peak":
      return "bg-amber-500 text-white dark:bg-amber-400 dark:text-gray-900";
  }
};

/**
 * WeeklyHeatmap - A detailed view of one week's task completion.
 *
 * Displays 7 consecutive days with larger cells and more detailed information.
 * Useful for viewing a specific week's completion pattern.
 */
export const WeeklyHeatmap: React.FC<WeeklyHeatmapProps> = ({
  weekStart,
  data,
  onDayClick,
  intensityThresholds,
}) => {
  const { days, totalThisWeek, totalPrevWeek, hasPrevWeekData, weekMax } = useMemo(() => {
    const currentDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
    const prevDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i - 7));

    const currentCounts = currentDays.map((d) => data[formatDateKey(d)] ?? 0);
    const prevCounts = prevDays.map((d) => data[formatDateKey(d)]);

    const totalCurrent = currentCounts.reduce((sum, n) => sum + n, 0);
    const totalPrev = prevDays.reduce((sum, d) => sum + (data[formatDateKey(d)] ?? 0), 0);
    const anyPrevKeyExists = prevCounts.some((v) => typeof v === "number");
    const max = Math.max(0, ...currentCounts);

    return {
      days: currentDays,
      totalThisWeek: totalCurrent,
      totalPrevWeek: totalPrev,
      hasPrevWeekData: anyPrevKeyExists,
      weekMax: max,
    };
  }, [data, weekStart]);

  // Normalize "today" once so we can hide stats for future days
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const weeklyDelta = useMemo(() => {
    if (!hasPrevWeekData) return { label: "—", tone: "neutral" as const, direction: "flat" as const };
    return percentChange(totalThisWeek, totalPrevWeek);
  }, [hasPrevWeekData, totalPrevWeek, totalThisWeek]);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Weekly View</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {formatLong(weekStart)} – {formatLong(weekEnd)}
        </p>

        <div className="mt-2 flex items-center gap-4 text-sm">
          <span className="text-gray-700 dark:text-gray-200 tabular-nums">
            {totalThisWeek} tasks completed
          </span>
          <span
            className={`inline-flex items-center gap-1 tabular-nums transition-colors duration-200 ${toneClasses(
              weeklyDelta.tone
            )}`}
            aria-label={
              hasPrevWeekData && weeklyDelta.label !== "—"
                ? `${weeklyDelta.label} versus last week`
                : "No previous week data"
            }
          >
            <span aria-hidden="true" className="text-xs">
              {arrowForDirection(weeklyDelta.direction)}
            </span>
            <span className="text-gray-500 dark:text-gray-400">{weeklyDelta.label} vs last week</span>
          </span>
        </div>
      </div>

      {/* Day cards */}
      <div className="flex flex-col gap-3">
        {days.map((date, dayIdx) => {
          const dateKey = formatDateKey(date);
          const count = data[dateKey] ?? 0;

          // Treat days after today as "upcoming" and avoid showing misleading -100% deltas
          const normalizedDate = new Date(date);
          normalizedDate.setHours(0, 0, 0, 0);
          const isFuture = normalizedDate.getTime() > today.getTime();

          const prevDate = addDays(date, -7);
          const prevKey = formatDateKey(prevDate);
          const prevCount = data[prevKey];
          const hasPrevDay = typeof prevCount === "number";
          const showDailyDelta = !isFuture && hasPrevDay;
          const dailyDelta = showDailyDelta
            ? percentChange(count, prevCount ?? 0)
            : { label: "", tone: "neutral" as const, direction: "flat" as const };

          const dayName = WEEKDAY_NAMES[dayIdx];
          const shortDate = formatShort(date);
          const activity = activityLevelForCounts(count, weekMax, intensityThresholds);

          return (
            <button
              key={dateKey}
              type="button"
              className={`w-full rounded-2xl bg-white px-5 py-4 text-left shadow-sm transition-all duration-200 dark:bg-gray-950 ${
                onDayClick ? "active:scale-[0.99]" : ""
              }`}
              onClick={() => onDayClick?.(date, count)}
              onKeyDown={(e) => {
                if (onDayClick && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onDayClick(date, count);
                }
              }}
              aria-label={`${dayName} ${shortDate}: ${count} ${count === 1 ? "task" : "tasks"} completed`}
              disabled={!onDayClick}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{dayName}</div>
                  <div className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{shortDate}</div>
                  <div className="mt-2 text-sm text-gray-700 dark:text-gray-200 tabular-nums">
                    <span className="text-base font-semibold text-gray-900 dark:text-gray-100">{count}</span> tasks
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`inline-flex min-h-[32px] items-center rounded-full px-3 text-xs font-semibold transition-colors duration-200 ${activityPillClasses(
                      activity
                    )}`}
                    aria-label={`Activity level: ${activity}`}
                  >
                    {activity}
                  </span>
                  {showDailyDelta && (
                    <span
                      className={`text-sm tabular-nums transition-colors duration-200 ${toneClasses(dailyDelta.tone)}`}
                      aria-label={
                        hasPrevDay && dailyDelta.label
                          ? `${dailyDelta.label} versus same day last week`
                          : "No comparison data"
                      }
                    >
                      <span aria-hidden="true" className="mr-1">
                        {arrowForDirection(dailyDelta.direction)}
                      </span>
                      {dailyDelta.label}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyHeatmap;
