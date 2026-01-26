"use client";
import React, { useCallback, useEffect, useState } from "react";
import {
  Tab as RACTab,
  TabList as RACTabList,
  Tabs as RACTabs,
  SelectionIndicator,
  composeRenderProps,
  type TabListProps,
  type TabProps,
  type TabsProps,
} from "react-aria-components";
import { tv } from "tailwind-variants";
import { twMerge } from "tailwind-merge";
import { useDateNavigation } from "@/lib/DateNavigationContext";
import ArchiveHeader from "./ArchiveHeader";
import CalendarViewSwitcher, { ViewMode } from "../app/history/CalendarViewSwitcher";
import ArchiveDailyWindow from "./ArchiveDailyWindow";
import { fetchDailyArchiveRange } from "@/app/archive/actions/fetchDailyRange";
import { ArchiveDailyTaskEntry } from "@/types/archive";

const VIEW_OPTIONS: { label: string; value: ViewMode }[] = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

const focusRing = tv({
  base:
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900",
});

const tabsStyles = tv({
  base: "flex gap-4 font-sans max-w-full",
  variants: {
    orientation: {
      horizontal: "flex-col",
      vertical: "flex-row",
    },
  },
});

function Tabs(props: TabsProps) {
  return (
    <RACTabs
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) => tabsStyles({ ...renderProps, className }))}
    />
  );
}

const tabListStyles = tv({
  base: "flex max-w-full p-1 -m-1 overflow-x-auto overflow-y-clip [scrollbar-width:none]",
  variants: {
    orientation: {
      horizontal: "flex-row",
      vertical: "flex-col items-start",
    },
  },
});

function TabList<T extends object>(props: TabListProps<T>) {
  return (
    <RACTabList
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) => tabListStyles({ ...renderProps, className }))}
    />
  );
}

const tabProps = tv({
  extend: focusRing,
  base:
    "group relative flex items-center cursor-default rounded-full px-3 py-1.5 text-sm font-medium transition forced-color-adjust-none [-webkit-tap-highlight-color:transparent]",
  variants: {
    isDisabled: {
      true:
        "text-neutral-200 dark:text-neutral-600 forced-colors:text-[GrayText] selected:text-white dark:selected:text-neutral-500 forced-colors:selected:text-[HighlightText] selected:bg-neutral-200 dark:selected:bg-neutral-600 forced-colors:selected:bg-[GrayText]",
    },
  },
});

function Tab(props: TabProps) {
  return (
    <RACTab
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) => tabProps({ ...renderProps, className }))}
    >
      {composeRenderProps(props.children, (children) => (
        <>
          {children}
          <SelectionIndicator className="absolute top-0 left-0 w-full h-full z-10 bg-white rounded-full mix-blend-difference group-disabled:bg-neutral-400 group-disabled:mix-blend-normal group-disabled:dark:bg-neutral-600 group-disabled:-z-1 motion-safe:transition-[translate,width,height] " />
        </>
      ))}
    </RACTab>
  );
}

const ArchiveViewTabs: React.FC = () => {
  const { viewMode, setViewMode, setCurrentDate } = useDateNavigation();

  const changeView = (next: ViewMode) => {
    if (next === "daily") setCurrentDate(new Date());
    setViewMode(next);
  };

  return (
    <Tabs selectedKey={viewMode} onSelectionChange={(key) => changeView(key as ViewMode)} className="w-full" orientation="horizontal">
      <TabList aria-label="Archive view switcher" className="justify-end">
        {VIEW_OPTIONS.map(({ label, value }) => (
          <Tab id={value} key={value} className={twMerge("text-gray-700 dark:text-gray-200", viewMode === value && "text-gray-900 dark:text-white") }>
            {label}
          </Tab>
        ))}
      </TabList>
    </Tabs>
  );
};

const DATE_CHUNK_DAYS = 14;

const formatDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const parseDateKey = (iso: string): Date => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const subtractDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() - days);
  return next;
};

type ArchiveData = {
  completedCountByDate: Record<string, number>;
  completedTasksByDate: Record<string, ArchiveDailyTaskEntry[]>;
  scheduledTasksByDate: Record<string, { title: string; category: string }[]>;
};

interface ArchiveViewProps {
  initialData: ArchiveData;
  initialDailyRange: {
    start: string;
    end: string;
    hasMorePast: boolean;
  };
}

/**
 * Client-side archive view component
 * 
 * Manages temporal navigation and data refetching as date changes
 * Displays calendar views (daily, weekly, monthly, yearly) with completed + scheduled tasks
 */
export default function ArchiveView({ initialData, initialDailyRange }: ArchiveViewProps) {
  const { 
    currentDate,
    viewMode,
  } = useDateNavigation();

  const [data, setData] = useState<ArchiveData>(initialData);
  const [loading, setLoading] = useState(false);
  const [dailyRange, setDailyRange] = useState(initialDailyRange);
  const [loadingDailyPast, setLoadingDailyPast] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get week start (Monday)
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const weekStart = getWeekStart(currentDate);

  /**
   * Build a count map of scheduled tasks for calendar views
   */
  const buildScheduledCountByDate = (): Record<string, number> => {
    const counts: Record<string, number> = {};
    Object.entries(data.scheduledTasksByDate).forEach(([date, tasks]) => {
      counts[date] = tasks.length;
    });
    return counts;
  };

  /**
   * Merge completed and scheduled tasks with isScheduled flag for daily view
   */
  const buildMergedDailyData = useCallback((): Record<string, (typeof data.completedTasksByDate[string])> => {
    const merged: Record<string, ArchiveDailyTaskEntry[]> = {};
    
    // Only include completed tasks in the archive
    Object.entries(data.completedTasksByDate).forEach(([date, tasks]) => {
      merged[date] = [...tasks];
    });
    
    // Note: Scheduled tasks are intentionally excluded from archive view
    // Archive should only show completed tasks (historical record)
    // Scheduled tasks can be viewed in the dashboard/calendar views
    
    return merged;
  }, [data.completedTasksByDate]);

  /**
   * Refetch data when date changes
   * This is a simplified version - in production, would fetch from server
   */
  useEffect(() => {
    // For now, keep using initial data
    // Real implementation would call a server action to fetch data for the new date range
    // This prevents excessive server calls and maintains temporal context
  }, [currentDate, viewMode]);

  const scheduledCountByDate = buildScheduledCountByDate();
  const mergedDailyData = buildMergedDailyData();

  const loadMoreDailyPast = useCallback(async () => {
    if (loadingDailyPast || !dailyRange.hasMorePast) return false;
    setLoadingDailyPast(true);

    try {
      const currentStart = parseDateKey(dailyRange.start);
      const endDate = subtractDays(currentStart, 1);
      const startDate = subtractDays(endDate, DATE_CHUNK_DAYS - 1);
      const startISO = formatDateKey(startDate);
      const endISO = formatDateKey(endDate);

      const response = await fetchDailyArchiveRange(startISO, endISO);

      setData((prev) => ({
        completedCountByDate: {
          ...prev.completedCountByDate,
          ...response.data.completedCountByDate,
        },
        completedTasksByDate: {
          ...prev.completedTasksByDate,
          ...response.data.completedTasksByDate,
        },
        scheduledTasksByDate: {
          ...prev.scheduledTasksByDate,
          ...response.data.scheduledTasksByDate,
        },
      }));

      setDailyRange((prev) => ({
        start: startISO,
        end: prev.end,
        hasMorePast: response.hasMorePast,
      }));

      const hasEntries =
        Object.keys(response.data.completedTasksByDate).length > 0 ||
        Object.keys(response.data.scheduledTasksByDate).length > 0 ||
        Object.keys(response.data.completedCountByDate).length > 0;

      return hasEntries;
    } catch (error) {
      console.error("Failed to load older archive data", error);
      return false;
    } finally {
      setLoadingDailyPast(false);
    }
  }, [dailyRange.hasMorePast, dailyRange.start, loadingDailyPast]);

  return (
    <main className="mx-auto max-w-xl px-4 py-6 space-y-6 min-h-screen">
      {/* Archive header with temporal navigation */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-xs uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wide">
              Memory
            </p>
            <h1 className="text-3xl font-black uppercase tracking-tight">
              Archive
            </h1>
          </div>
          <ArchiveViewTabs />
        </div>
        <ArchiveHeader />
      </div>

      {/* Calendar view switcher with dynamic data */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600 dark:text-gray-400">Loading...</div>
        </div>
      ) : (
        <CalendarViewSwitcher
          year={year}
          month={month}
          weekStart={weekStart}
          data={data.completedCountByDate}
          dailyData={mergedDailyData}
          scheduledData={scheduledCountByDate}
          showTabs={false}
          renderDaily={() => (
            <ArchiveDailyWindow
              data={mergedDailyData}
              rangeStart={dailyRange.start}
              rangeEnd={dailyRange.end}
              onLoadMorePast={loadMoreDailyPast}
              loadingPast={loadingDailyPast}
              hasMorePast={dailyRange.hasMorePast}
              focusDateKey={formatDateKey(currentDate)}
            />
          )}
        />
      )}
    </main>
  );
}
