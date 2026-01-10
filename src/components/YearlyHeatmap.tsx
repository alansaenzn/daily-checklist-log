"use client";

import React, { useState, useEffect } from "react";
import {
  generateYearWeeks,
  formatDateKey,
  getCountForDate,
  getDayLabels,
  getDaysInYear,
  getMonthLabelsForWeeks,
} from "@/lib/heatmap-date-utils";
import { getColorClass, getColorLabel } from "@/lib/heatmap-color-utils";
import type { IntensityThresholds } from "@/lib/user-settings";

interface YearlyHeatmapProps {
  /** The year to display (e.g., 2025) */
  year: number;

  /** Aggregated task data: { "YYYY-MM-DD": count } */
  data: Record<string, number>;

  /** Optional callback when a day is clicked */
  onDayClick?: (date: Date, count: number) => void;

  /** Optional CSS class for the container */
  className?: string;

  /** Optional thresholds for activity intensity */
  intensityThresholds?: IntensityThresholds;
}

/**
 * YearlyHeatmap - A GitHub-style contribution graph for task completion.
 *
 * Displays all days in a year with color intensity based on task completion count.
 * Layout: Columns = weeks, Rows = days of week (Mon-Sun)
 *
 * Features:
 * - Automatic leap year handling
 * - Month labels across the top
 * - Hover tooltips showing date and count
 * - Click handler for drill-down functionality
 * - Full accessibility with aria-labels
 * - Dark mode support
 * - No hydration mismatches
 */
export const YearlyHeatmap: React.FC<YearlyHeatmapProps> = ({
  year,
  data,
  onDayClick,
  className = "",
  intensityThresholds,
}) => {
  // Generate weeks and month labels on first render (avoids hydration mismatch)
  const weeks = React.useMemo(() => generateYearWeeks(year), [year]);
  const monthLabels = React.useMemo(
    () => getMonthLabelsForWeeks(year, weeks),
    [year, weeks]
  );
  const dayLabels = getDayLabels();
  const daysInYear = getDaysInYear(year);

  const stats = React.useMemo(() => {
    const weekdayTotals = Array.from({ length: 7 }, () => 0);
    let longestStreak = 0;
    let currentStreak = 0;
    let activeDays = 0;
    let total = 0;

    const cursor = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);

    while (cursor <= end) {
      const key = formatDateKey(cursor);
      const count = data[key] ?? 0;
      total += count;

      if (count > 0) {
        activeDays += 1;
        currentStreak += 1;
        longestStreak = Math.max(longestStreak, currentStreak);
        weekdayTotals[cursor.getDay()] += count;
      } else {
        currentStreak = 0;
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    const mostActiveWeekdayIndex = weekdayTotals.reduce((best, value, idx, arr) => {
      if (value > arr[best]) return idx;
      return best;
    }, 0);

    const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    return {
      longestStreak,
      averagePerActive: activeDays > 0 ? total / activeDays : 0,
      mostActiveWeekday: weekdayNames[mostActiveWeekdayIndex] ?? "—",
    };
  }, [data, year]);

  // Only track hover state on the client to avoid hydration issues
  const [mounted, setMounted] = useState(false);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate total completed tasks for the year
  const totalCompleted = Object.values(data).reduce((sum, count) => sum + count, 0);

  return (
    <div className={`w-full ${className}`} role="region" aria-label={`${year} task completion heatmap`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
          {year} Task Completion
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {totalCompleted} tasks completed • {daysInYear} days in year
        </p>
      </div>

      {/* Yearly stats */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40">S</span>
            Longest Streak
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.longestStreak} days</div>
        </div>

        <div className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/40">A</span>
            Average per Active
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.averagePerActive.toFixed(1)} tasks</div>
        </div>

        <div className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/40">W</span>
            Most Active Weekday
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.mostActiveWeekday}</div>
        </div>
      </div>

      {/* Heatmap Container */}
      <div className="overflow-x-auto pb-4">
        <div className="inline-block">
          {/* Month labels row */}
          <div className="flex mb-2 ml-10">
            {monthLabels.map((monthLabel, idx) => {
              const weekSpan = monthLabel.endWeek - monthLabel.startWeek + 1;
              const cellWidth = weekSpan * 28; // Each week is ~4 cells (28px with gaps)

              return (
                <div
                  key={`month-${monthLabel.monthNumber}`}
                  className="text-xs font-semibold text-gray-600 dark:text-gray-400 px-1"
                  style={{ minWidth: `${cellWidth}px` }}
                >
                  {monthLabel.month}
                </div>
              );
            })}
          </div>

          {/* Heatmap grid */}
          <div className="flex">
            {/* Day of week labels (left column) */}
            <div className="flex-shrink-0 w-10 mr-2">
              <div className="flex flex-col gap-1">
                {dayLabels.map((label) => (
                  <div
                    key={label}
                    className="h-6 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-400"
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Week columns */}
            <div className="flex gap-1">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-1">
                  {week.map((date, dayIdx) => {
                    if (!date) {
                      // Empty cell for days outside the year
                      return (
                        <div
                          key={`${weekIdx}-${dayIdx}-empty`}
                          className="h-6 w-6 flex-shrink-0 rounded-sm bg-transparent"
                        />
                      );
                    }

                    const dateKey = formatDateKey(date);
                    const count = getCountForDate(date, data);
                    const colorClass = getColorClass(count, intensityThresholds);
                    const colorLabel = getColorLabel(count, intensityThresholds);
                    const isHovered = mounted && hoveredDate === dateKey;

                    // Format date for accessibility
                    const dayName = date.toLocaleDateString("en-US", {
                      weekday: "long",
                    });
                    const fullDate = date.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    });

                    return (
                      <div
                        key={dateKey}
                        className={`h-6 w-6 flex-shrink-0 rounded-sm transition-all duration-200 ${colorClass} ${
                          isHovered
                            ? "ring-2 ring-offset-2 ring-blue-400 dark:ring-offset-gray-900"
                            : ""
                        } ${onDayClick ? "cursor-pointer hover:opacity-80" : ""}`}
                        title={`${dateKey}: ${count} task${count !== 1 ? "s" : ""}`}
                        onMouseEnter={() => {
                          if (mounted) setHoveredDate(dateKey);
                        }}
                        onMouseLeave={() => {
                          if (mounted) setHoveredDate(null);
                        }}
                        onClick={() => onDayClick?.(date, count)}
                        role={onDayClick ? "button" : undefined}
                        tabIndex={onDayClick ? 0 : undefined}
                        aria-label={`${fullDate}, ${dayName}. ${count} task${count !== 1 ? "s" : ""} completed. ${colorLabel}.`}
                        onKeyDown={(e) => {
                          if (onDayClick && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault();
                            onDayClick(date, count);
                          }
                        }}
                      >
                        {/* Tooltip on hover */}
                        {isHovered && (
                          <div className="absolute z-10 left-1/2 -translate-x-1/2 bottom-full mb-2 pointer-events-none">
                            <div className="rounded bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-2 py-1 shadow-lg whitespace-nowrap">
                              <div className="font-semibold">{dateKey}</div>
                              <div>
                                {count} {count === 1 ? "task" : "tasks"}
                              </div>
                              <div className="text-gray-400 dark:text-gray-600 text-xs">
                                {colorLabel}
                              </div>
                            </div>
                            <div className="w-2 h-2 bg-gray-900 dark:bg-gray-100 absolute left-1/2 -translate-x-1/2 top-full rotate-45" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
        <span className="font-semibold">Less</span>
        <div className="flex gap-1">
          <div
            className="h-4 w-4 rounded-sm bg-gray-200 dark:bg-gray-700"
            title="No activity"
            aria-label="No activity"
          />
          <div
            className="h-4 w-4 rounded-sm bg-emerald-100 dark:bg-emerald-900"
            title="Light activity"
            aria-label="Light activity"
          />
          <div
            className="h-4 w-4 rounded-sm bg-emerald-400 dark:bg-emerald-600"
            title="Medium activity"
            aria-label="Medium activity"
          />
          <div
            className="h-4 w-4 rounded-sm bg-emerald-600 dark:bg-emerald-400"
            title="High activity"
            aria-label="High activity"
          />
          <div
            className="h-4 w-4 rounded-sm bg-emerald-800 dark:bg-emerald-300"
            title="Peak activity"
            aria-label="Peak activity"
          />
        </div>
        <span className="font-semibold">More</span>
      </div>
    </div>
  );
};

export default YearlyHeatmap;
