import React from "react";
import { getColorClass, getIntensityColorClass } from "@/lib/heatmap-color-utils";
import type { IntensityThresholds } from "@/lib/user-settings";

interface HeatmapCalendarProps {
  year: number;
  month: number; // 0-indexed (0 = January)
  data: Record<string, number>; // { "YYYY-MM-DD": count }

  /** Default: "gradient" (existing behavior). */
  variant?: "gradient" | "momentum";

  /** Used when variant is "momentum" to map activity intensity. */
  intensityThresholds?: IntensityThresholds;
}

const getMonthMatrix = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Monday = 0, Sunday = 6
  const startDay = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();
  const matrix: (string | null)[] = [];

  // Fill leading empty days
  for (let i = 0; i < startDay; i++) matrix.push(null);
  // Fill days of month
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    matrix.push(date.toISOString().slice(0, 10));
  }
  // Fill trailing empty days
  while (matrix.length % 7 !== 0) matrix.push(null);
  return matrix;
};

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const HeatmapCalendar: React.FC<HeatmapCalendarProps> = ({
  year,
  month,
  data,
  variant = "gradient",
  intensityThresholds,
}) => {
  const matrix = getMonthMatrix(year, month);

  return (
    <div className="inline-block">
      <div className="grid grid-cols-7 border-b bg-zinc-50 text-xs font-medium text-zinc-600">
        {weekdayLabels.map((label) => (
          <div key={label} className="px-2 py-1 text-center">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {matrix.map((date, idx) => {
          if (!date) {
            return <div key={idx} className="h-8 w-8 bg-transparent" />;
          }
          const count = data[date] || 0;
          const colorClass =
            variant === "momentum"
              ? getIntensityColorClass(count, intensityThresholds)
              : getColorClass(count);
          return (
            <div
              key={date}
              className={`heatmap-cell relative group h-8 w-8 flex items-center justify-center rounded ${colorClass} transition-colors duration-200`}
            >
              <span className="sr-only">{date}: {count} completed</span>
              {/* Tooltip */}
              <div className="absolute z-10 hidden group-hover:flex flex-col items-center left-1/2 top-10 -translate-x-1/2">
                <div className="rounded bg-zinc-900 text-white text-xs px-2 py-1 shadow-lg whitespace-nowrap">
                  <div>{date}</div>
                  <div>{count} completed</div>
                </div>
                <div className="w-2 h-2 bg-zinc-900 rotate-45 -mt-1" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HeatmapCalendar;
