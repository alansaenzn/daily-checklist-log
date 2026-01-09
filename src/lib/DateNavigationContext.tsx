"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

/**
 * Shared date state for Archive views
 * Maintains a single currentDate and derives all temporal ranges from it
 * Ensures consistent navigation across daily, weekly, monthly, and yearly views
 */

export interface DateRange {
  startDate: Date;
  endDate: Date;
  label: string; // e.g., "January 2026", "Dec 29 – Jan 4"
}

interface DateNavigationContextType {
  currentDate: Date;
  goToPreviousPeriod: () => void;
  goToNextPeriod: () => void;
  goToToday: () => void;
  setCurrentDate: (date: Date) => void;
  viewMode: "daily" | "weekly" | "monthly" | "yearly";
  setViewMode: (mode: "daily" | "weekly" | "monthly" | "yearly") => void;
  
  // Derived ranges for each view
  getDailyRange: () => DateRange;
  getWeeklyRange: () => DateRange;
  getMonthlyRange: () => DateRange;
  getYearlyRange: () => DateRange;
  getCurrentRange: () => DateRange;
}

const DateNavigationContext = createContext<DateNavigationContextType | undefined>(undefined);

/**
 * Get Monday of the week containing the given date
 */
const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

/**
 * Format a date as YYYY-MM-DD for display
 */
const formatShortDate = (date: Date): string => {
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${month}/${day}`;
};

/**
 * Format a month and year nicely
 */
const formatMonthYear = (date: Date): string => {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
};

export const DateNavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"daily" | "weekly" | "monthly" | "yearly">("monthly");

  /**
   * Daily range: just the current day
   */
  const getDailyRange = useCallback((): DateRange => {
    const start = new Date(currentDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    return {
      startDate: start,
      endDate: end,
      label: formatShortDate(currentDate),
    };
  }, [currentDate]);

  /**
   * Weekly range: Monday to Sunday of the week containing currentDate
   */
  const getWeeklyRange = useCallback((): DateRange => {
    const weekStart = getWeekStart(currentDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    const label = `${formatShortDate(weekStart)} – ${formatShortDate(weekEnd)}`;
    return {
      startDate: weekStart,
      endDate: weekEnd,
      label,
    };
  }, [currentDate]);

  /**
   * Monthly range: first to last day of the month containing currentDate
   */
  const getMonthlyRange = useCallback((): DateRange => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    end.setHours(23, 59, 59, 999);
    return {
      startDate: start,
      endDate: end,
      label: formatMonthYear(currentDate),
    };
  }, [currentDate]);

  /**
   * Yearly range: Jan 1 to Dec 31 of the year containing currentDate
   */
  const getYearlyRange = useCallback((): DateRange => {
    const year = currentDate.getFullYear();
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    end.setHours(23, 59, 59, 999);
    return {
      startDate: start,
      endDate: end,
      label: String(year),
    };
  }, [currentDate]);

  /**
   * Get the range for the current view mode
   */
  const getCurrentRange = useCallback((): DateRange => {
    switch (viewMode) {
      case "daily":
        return getDailyRange();
      case "weekly":
        return getWeeklyRange();
      case "monthly":
        return getMonthlyRange();
      case "yearly":
        return getYearlyRange();
    }
  }, [viewMode, getDailyRange, getWeeklyRange, getMonthlyRange, getYearlyRange]);

  /**
   * Navigate to the previous period based on current view mode
   */
  const goToPreviousPeriod = useCallback(() => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case "daily":
        newDate.setDate(newDate.getDate() - 1);
        break;
      case "weekly":
        newDate.setDate(newDate.getDate() - 7);
        break;
      case "monthly":
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case "yearly":
        newDate.setFullYear(newDate.getFullYear() - 1);
        break;
    }
    setCurrentDate(newDate);
  }, [currentDate, viewMode]);

  /**
   * Navigate to the next period based on current view mode
   */
  const goToNextPeriod = useCallback(() => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case "daily":
        newDate.setDate(newDate.getDate() + 1);
        break;
      case "weekly":
        newDate.setDate(newDate.getDate() + 7);
        break;
      case "monthly":
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case "yearly":
        newDate.setFullYear(newDate.getFullYear() + 1);
        break;
    }
    setCurrentDate(newDate);
  }, [currentDate, viewMode]);

  /**
   * Jump back to today
   */
  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const value: DateNavigationContextType = {
    currentDate,
    goToPreviousPeriod,
    goToNextPeriod,
    goToToday,
    setCurrentDate,
    viewMode,
    setViewMode,
    getDailyRange,
    getWeeklyRange,
    getMonthlyRange,
    getYearlyRange,
    getCurrentRange,
  };

  return (
    <DateNavigationContext.Provider value={value}>
      {children}
    </DateNavigationContext.Provider>
  );
};

/**
 * Hook to access date navigation context
 */
export const useDateNavigation = (): DateNavigationContextType => {
  const context = useContext(DateNavigationContext);
  if (!context) {
    throw new Error("useDateNavigation must be used within DateNavigationProvider");
  }
  return context;
};
