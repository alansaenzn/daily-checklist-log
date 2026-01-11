/**
 * DashboardView Component
 * 
 * Dashboard with internal tabs:
 * - Momentum: Snapshot and health
 * - Calendar: Preview of scheduled tasks
 * - Projects: Contextual organization of work
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { SystemHealthCard } from "@/components/SystemHealthCard";
import { HeatmapCalendar } from "@/components/HeatmapCalendar";
import { CalendarTabView, ScheduledTask, TimelineSourceTask } from "@/components/CalendarTabView";
import { ProjectsTabView, Project } from "@/components/ProjectsTabView";
import { useUserSettings } from "@/components/UserSettingsProvider";
import { intensityThresholdsFromSettings } from "@/lib/user-settings";
import WeeklyCompletionTrend from "@/components/WeeklyCompletionTrend";
import { KeyMetricsCarousel } from "@/components/KeyMetricsCarousel";
import { calculateSystemHealth, type MomentumDay } from "@/lib/momentum/calculateSystemHealth";

interface DashboardViewProps {
  heatmapData: Record<string, number>;
  heatmapDifficultySumData: Record<string, number>;
  heatmapYear: number;
  heatmapMonth: number;
  scheduledTasks: ScheduledTask[];
  timelineTasks: TimelineSourceTask[];
  projects: Project[];
  momentumCompletedByDate: Record<string, number[]>;
  momentumScheduledByDate: Record<string, number[]>;
}

type DashboardTab = "momentum" | "calendar" | "projects";

export function DashboardView({
  heatmapData,
  heatmapDifficultySumData,
  heatmapYear,
  heatmapMonth,
  scheduledTasks,
  timelineTasks,
  projects,
  momentumCompletedByDate,
  momentumScheduledByDate,
}: DashboardViewProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>("momentum");
  const [metricsRange, setMetricsRange] = useState<"mtd" | "full">("mtd");
  const { settings } = useUserSettings();
  const intensityThresholds = intensityThresholdsFromSettings(settings);
  const projectLookup = projects.reduce<Record<string, string>>((acc, project) => {
    acc[project.id] = project.name;
    return acc;
  }, {});

  // Build MomentumDay data for the last 7 days
  const buildMomentumDays = (): MomentumDay[] => {
    const today = new Date();
    const days: MomentumDay[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const year = date.getFullYear();
      const month = `${date.getMonth() + 1}`.padStart(2, "0");
      const day = `${date.getDate()}`.padStart(2, "0");
      const dateKey = `${year}-${month}-${day}`;

      const completedDifficulties = momentumCompletedByDate[dateKey] || [];
      const scheduledDifficulties = momentumScheduledByDate[dateKey] || [];

      days.push({
        date: dateKey,
        completedTasks: completedDifficulties.map((difficulty) => ({ difficulty: difficulty as 1 | 2 | 3 | 4 | 5 })),
        scheduledTasks: scheduledDifficulties.map((difficulty) => ({ difficulty: difficulty as 1 | 2 | 3 | 4 | 5 })),
      });
    }

    return days;
  };

  const momentumDays = buildMomentumDays();
  const systemHealthResult = calculateSystemHealth(momentumDays, 7);
  const { percent: systemHealthPercent, breakdown } = systemHealthResult;

  return (
    <>
      {/* Tab Navigation */}
      <div className="mb-4 md:mb-6">
        <div className="flex items-end justify-between gap-2 md:gap-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-3 md:gap-6">
            <button
              onClick={() => setActiveTab("momentum")}
              className={`pb-2 md:pb-3 text-xs md:text-sm font-bold uppercase tracking-wide transition-colors relative ${
                activeTab === "momentum"
                  ? "text-blue-600 dark:text-blue-500"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Momentum
              {activeTab === "momentum" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-500" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("calendar")}
              className={`pb-2 md:pb-3 text-xs md:text-sm font-bold uppercase tracking-wide transition-colors relative ${
                activeTab === "calendar"
                  ? "text-blue-600 dark:text-blue-500"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Calendar
              {activeTab === "calendar" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-500" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("projects")}
              className={`pb-2 md:pb-3 text-xs md:text-sm font-bold uppercase tracking-wide transition-colors relative ${
                activeTab === "projects"
                  ? "text-blue-600 dark:text-blue-500"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Projects
              {activeTab === "projects" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-500" />
              )}
            </button>
          </div>

          <Link
            href="/dashboard/settings"
            className="pb-2 md:pb-3 text-xs md:text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            Settings
          </Link>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "momentum" && (
        <div className="space-y-3 md:space-y-6">
          {/* Header */}
          <div className="space-y-1 md:space-y-2">
            <p className="text-[10px] md:text-xs uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wide">
              Reflection
            </p>
            <h2 className="text-xl md:text-3xl font-black uppercase tracking-tight">
              Your Momentum
            </h2>
          </div>

          {/* Momentum Snapshot Section */}
          <div className="space-y-2 md:space-y-3">
            <h3 className="text-xs md:text-sm font-bold uppercase text-gray-900 dark:text-white">
              Monthly Activity
            </h3>
            {Object.keys(heatmapData).length > 0 ? (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-3 md:p-6 overflow-x-auto">
                <div className="inline-block min-w-full">
                  <HeatmapCalendar
                    data={heatmapData}
                    year={heatmapYear}
                    month={heatmapMonth}
                    variant="momentum"
                    intensityThresholds={intensityThresholds}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  No activity yet this month. Start completing tasks to see your momentum!
                </p>
              </div>
            )}

            {/* Key Metrics below the Monthly Activity card with MTD vs YTD toggle */}
            {Object.keys(heatmapData).length > 0 && (
              <div className="space-y-2 md:space-y-3">
                <div className="flex items-center justify-end gap-1 md:gap-2">
                  <span className="text-[9px] md:text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Range</span>
                  <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setMetricsRange("mtd")}
                      className={`px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs font-semibold uppercase tracking-wide ${
                        metricsRange === "mtd"
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      MTD
                    </button>
                    <button
                      type="button"
                      onClick={() => setMetricsRange("full")}
                      className={`px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs font-semibold uppercase tracking-wide border-l border-gray-200 dark:border-gray-700 ${
                        metricsRange === "full"
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      YTD
                    </button>
                  </div>
                </div>
                <div id="key-metrics-section">
                  <KeyMetricsCarousel
                    data={heatmapData}
                    difficultySumData={heatmapDifficultySumData}
                    year={heatmapYear}
                    month={heatmapMonth}
                    intensityPeak={settings.intensityPeak}
                    rangeMode={metricsRange}
                  />
                </div>
              </div>
            )}
          </div>

          {/* System Health Card */}
          <div>
            <SystemHealthCard
              systemHealthPercent={systemHealthPercent}
              activeDays={breakdown.active}
              neutralDays={breakdown.neutral}
              inactiveDays={breakdown.inactive}
            />
          </div>

          {/* Weekly completions trend */}
          <div>
            <WeeklyCompletionTrend dailyCounts={heatmapData} />
          </div>
        </div>
      )}

      {activeTab === "calendar" && (
        <CalendarTabView
          scheduledTasks={scheduledTasks}
          timelineTasks={timelineTasks}
          projectLookup={projectLookup}
        />
      )}

      {activeTab === "projects" && (
        <ProjectsTabView projects={projects} />
      )}
    </>
  );
}
