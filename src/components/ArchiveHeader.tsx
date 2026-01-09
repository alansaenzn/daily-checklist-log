"use client";
import React from "react";
import { useDateNavigation } from "@/lib/DateNavigationContext";

/**
 * Archive header with minimal temporal navigation
 * 
 * Single row with previous/next controls and a Today chip.
 * The label adapts to the active view mode (daily/weekly/monthly/yearly).
 */
export default function ArchiveHeader() {
  const { 
    goToPreviousPeriod, 
    goToNextPeriod, 
    goToToday,
    getCurrentRange,
    currentDate,
    setCurrentDate,
    viewMode,
  } = useDateNavigation();

  const range = getCurrentRange();

  const addDays = (date: Date, deltaDays: number) => {
    const next = new Date(date);
    next.setDate(next.getDate() + deltaDays);
    return next;
  };

  const modeLabel = viewMode.charAt(0).toUpperCase() + viewMode.slice(1);
  const displayLabel = viewMode === "daily"
    ? currentDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })
    : range.label;

  const handlePrev = () => {
    if (viewMode === "daily") {
      setCurrentDate(addDays(currentDate, -1));
      return;
    }
    goToPreviousPeriod();
  };

  const handleNext = () => {
    if (viewMode === "daily") {
      setCurrentDate(addDays(currentDate, 1));
      return;
    }
    goToNextPeriod();
  };

  return (
    <header className="mb-6">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white/80 px-3 py-2 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
        <button
          onClick={handlePrev}
          className="flex-shrink-0 p-2 rounded-full border border-gray-300 text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 dark:focus:ring-gray-600"
          aria-label={`Previous ${viewMode}`}
          title={`Previous ${viewMode}`}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex flex-col items-center text-center">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{modeLabel}</span>
          <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{displayLabel}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 dark:focus:ring-gray-600"
            title="Jump to today"
          >
            Today
          </button>
          <button
            onClick={handleNext}
            className="flex-shrink-0 p-2 rounded-full border border-gray-300 text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 dark:focus:ring-gray-600"
            aria-label={`Next ${viewMode}`}
            title={`Next ${viewMode}`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
