
"use client";
import React, { useState, useEffect } from "react";
import { useDateNavigation } from "@/lib/DateNavigationContext";

// Import view components
import CalendarMonthView from "../../components/CalendarMonthView";

import WeeklyHeatmap from "../../components/WeeklyHeatmap";
import YearlyHeatmap from "../../components/YearlyHeatmap";
import DailyTaskList from "../../components/DailyTaskList";

export type ViewMode = "daily" | "weekly" | "monthly" | "yearly";

interface CalendarViewSwitcherProps {
  year: number;
  month: number;
  weekStart?: Date; // Monday of the current week
  data: Record<string, number>;
  dailyData: Record<string, { title: string; category: string; completed_at: string | null; isScheduled?: boolean }[]>;
  scheduledData?: Record<string, number>; // Count of scheduled tasks by date
  renderDaily?: () => React.ReactNode;
  showTabs?: boolean;
}

const VIEW_MODES: { label: string; value: ViewMode }[] = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

export default function CalendarViewSwitcher({
  year,
  month,
  weekStart,
  data,
  dailyData,
  scheduledData = {},
  renderDaily,
  showTabs = true,
}: CalendarViewSwitcherProps) {
  const { viewMode, setViewMode, setCurrentDate } = useDateNavigation();
  const [mounted, setMounted] = useState(false);

  const changeView = (next: ViewMode) => {
    if (next === "daily") {
      setCurrentDate(new Date());
    }
    setViewMode(next);
  };

  // On mount, read from localStorage (client only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("historyViewMode");
      if (
        stored === "daily" ||
        stored === "weekly" ||
        stored === "monthly" ||
        stored === "yearly"
      ) {
        setViewMode(stored as ViewMode);
      }
    }
    setMounted(true);
  }, [setViewMode]);

  // Persist to localStorage when view changes
  useEffect(() => {
    if (mounted && typeof window !== "undefined") {
      window.localStorage.setItem("historyViewMode", viewMode);
    }
  }, [mounted, viewMode]);

  const handleDayClick = (date: Date) => {
    setCurrentDate(date);
    setViewMode("daily");
  };

  // Derive map of days where a critical habit was missed
  // Heuristic: any scheduled item with category including "habit" or "critical" not completed
  const criticalMissByDate: Record<string, boolean> = {};
  Object.entries(dailyData).forEach(([dateKey, items]) => {
    const missed = items.some((item) => {
      const cat = (item.category || "").toLowerCase();
      const isCriticalHabit = cat.includes("habit") || cat.includes("critical") || cat.includes("priority");
      return item.isScheduled && isCriticalHabit && item.completed_at === null;
    });
    if (missed) criticalMissByDate[dateKey] = true;
  });

  // Avoid rendering until view is set (prevents hydration mismatch)
  if (!mounted) return null;

  return (
    <section>
      {showTabs && (
        <div className="flex gap-2 mb-6 flex-wrap" role="group" aria-label="History view switcher">
          {VIEW_MODES.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => changeView(value)}
              className={`px-4 py-2 rounded-full text-sm font-semibold focus:outline-none transition-colors ${
                viewMode === value
                  ? "bg-gray-900 text-white shadow-sm dark:bg-white dark:text-gray-900"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-700 shadow-sm p-4">
        {viewMode === "daily" && (renderDaily ? renderDaily() : <DailyTaskList year={year} month={month} data={dailyData} />)}
        {viewMode === "weekly" && weekStart && (
          <WeeklyHeatmap
            weekStart={weekStart}
            data={data}
            onDayClick={(date) => handleDayClick(date)}
          />
        )}
        {viewMode === "monthly" && (
          <CalendarMonthView
            year={year}
            month={month}
            data={data}
            dailyData={dailyData}
            scheduledData={scheduledData}
            criticalMissByDate={criticalMissByDate}
            onDayClick={(date) => handleDayClick(date)}
          />
        )}
    
        {viewMode === "yearly" && (
          <YearlyHeatmap
            year={year}
            data={data}
            onDayClick={(date) => handleDayClick(date)}
          />
        )}
        
      </div>
    </section>
  );
}
