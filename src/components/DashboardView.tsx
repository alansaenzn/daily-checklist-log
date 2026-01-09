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
import { useMomentumSettings } from "@/components/MomentumSettingsProvider";
import WeeklyCompletionTrend from "@/components/WeeklyCompletionTrend";
import { KeyMetricsCarousel } from "@/components/KeyMetricsCarousel";

interface DashboardViewProps {
  heatmapData: Record<string, number>;
  heatmapDifficultySumData: Record<string, number>;
  heatmapYear: number;
  heatmapMonth: number;
  scheduledTasks: ScheduledTask[];
  timelineTasks: TimelineSourceTask[];
  projects: Project[];
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
}: DashboardViewProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>("momentum");
  const [metricsRange, setMetricsRange] = useState<"mtd" | "full">("mtd");
  const { momentumThreshold } = useMomentumSettings();
  const projectLookup = projects.reduce<Record<string, string>>((acc, project) => {
    acc[project.id] = project.name;
    return acc;
  }, {});

  return (
    <>
      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex items-end justify-between gap-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab("momentum")}
              className={`pb-3 text-sm font-bold uppercase tracking-wide transition-colors relative ${
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
              className={`pb-3 text-sm font-bold uppercase tracking-wide transition-colors relative ${
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
              className={`pb-3 text-sm font-bold uppercase tracking-wide transition-colors relative ${
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
            className="pb-3 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            Settings
          </Link>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "momentum" && (
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <p className="text-xs uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wide">
              Reflection
            </p>
            <h2 className="text-3xl font-black uppercase tracking-tight">
              Your Momentum
            </h2>
          </div>

          {/* Momentum Snapshot Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase text-gray-900 dark:text-white">
              Monthly Activity
            </h3>
            {Object.keys(heatmapData).length > 0 ? (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
                <HeatmapCalendar
                  data={heatmapData}
                  year={heatmapYear}
                  month={heatmapMonth}
                  variant="momentum"
                  momentumThreshold={momentumThreshold}
                />
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
              <div className="space-y-3">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Range</span>
                  <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setMetricsRange("mtd")}
                      className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${
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
                      className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide border-l border-gray-200 dark:border-gray-700 ${
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
                    momentumThreshold={momentumThreshold}
                    rangeMode={metricsRange}
                  />
                </div>
              </div>
            )}
          </div>

          {/* System Health Card */}
          <div>
            <SystemHealthCard
              activeDays={5}
              neutralDays={1}
              inactiveDays={1}
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
