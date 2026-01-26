/**
 * GoalTemplatesListView (Lists Dashboard)
 * 
 * Main component for managing task lists with tabs:
 * - Dashboard: Overview stats and summary
 * - My Plan: System templates (pre-built)
 * - Plans: User-created templates
 */

"use client";

import { useState, useMemo } from "react";
import { GoalTemplate } from "@/lib/task-types";
import { GoalTemplateCard } from "@/components/GoalTemplateCard";
import { GoalTemplatePreview } from "@/components/GoalTemplatePreview";
import { CreateTemplateModal } from "@/components/CreateTemplateModal";
import { SystemHealthCard } from "@/components/SystemHealthCard";
import { HeatmapCalendar } from "@/components/HeatmapCalendar";
import { GOAL_FOCUS_AREAS } from "@/lib/task-types";
import { calculateSystemHealth, type MomentumDay } from "@/lib/momentum/calculateSystemHealth";
import {
  getGoalTemplateWithTasks,
  applyGoalTemplate,
  getGoalTemplates,
} from "@/app/actions/goal-templates";
import type { GoalTemplateWithTasks } from "@/lib/task-types";

interface GoalTemplatesListViewProps {
  templates: GoalTemplate[];
  heatmapData?: Record<string, number>;
  heatmapYear?: number;
  heatmapMonth?: number;
  momentumCompletedByDate?: Record<string, number[]>;
  momentumScheduledByDate?: Record<string, number[]>;
}

type TabType = "dashboard" | "templates" | "plans";

export function GoalTemplatesListView({
  templates: initialTemplates,
  heatmapData = {},
  heatmapYear = new Date().getFullYear(),
  heatmapMonth = new Date().getMonth(),
  momentumCompletedByDate = {},
  momentumScheduledByDate = {},
}: GoalTemplatesListViewProps) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [selectedFocus, setSelectedFocus] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] =
    useState<GoalTemplateWithTasks | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const momentumDays = useMemo<MomentumDay[]>(() => {
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
        completedTasks: completedDifficulties.map((difficulty) => ({
          difficulty: difficulty as 1 | 2 | 3 | 4 | 5,
        })),
        scheduledTasks: scheduledDifficulties.map((difficulty) => ({
          difficulty: difficulty as 1 | 2 | 3 | 4 | 5,
        })),
      });
    }

    return days;
  }, [momentumCompletedByDate, momentumScheduledByDate]);

  const systemHealthResult = useMemo(
    () => calculateSystemHealth(momentumDays, 7),
    [momentumDays]
  );
  const { percent: systemHealthPercent, breakdown } = systemHealthResult;
  const { active: activeDays, neutral: neutralDays, inactive: inactiveDays } = breakdown;

  // Separate system templates (My Plan) from user templates (Plans)
  const systemTemplates = useMemo(
    () => templates.filter((t) => t.is_system),
    [templates]
  );
  
  const userTemplates = useMemo(
    () => templates.filter((t) => !t.is_system),
    [templates]
  );

  // Current view templates based on active tab
  const currentTemplates = useMemo(() => {
    if (activeTab === "templates") return systemTemplates;
    if (activeTab === "plans") return userTemplates;
    return [];
  }, [activeTab, systemTemplates, userTemplates]);

  // Filter templates by focus area
  const filteredTemplates = selectedFocus
    ? currentTemplates.filter((t) =>
        t.focus_area.toLowerCase().includes(selectedFocus.toLowerCase())
      )
    : currentTemplates;

  const handlePreview = async (templateId: string) => {
    try {
      const template = await getGoalTemplateWithTasks(templateId);
      setPreviewTemplate(template);
    } catch (error) {
      showNotification(
        "error",
        "Failed to load template preview. Please try again."
      );
    }
  };

  const handleApply = async () => {
    if (!previewTemplate) return;

    setIsApplying(true);
    try {
      const result = await applyGoalTemplate(previewTemplate.id);
      showNotification(
        "success",
        `✓ Applied "${result.templateName}" with ${result.templatesCreated} tasks!`
      );
      setPreviewTemplate(null);
    } catch (error) {
      showNotification(
        "error",
        error instanceof Error ? error.message : "Failed to apply template"
      );
    } finally {
      setIsApplying(false);
    }
  };

  const showNotification = (
    type: "success" | "error",
    message: string
  ) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleTemplateCreated = async (newTemplate: any) => {
    showNotification(
      "success",
      `✓ Created "${newTemplate.name}" with ${newTemplate.taskCount} tasks!`
    );
    
    // Refresh the templates list
    try {
      const updatedTemplates = await getGoalTemplates();
      setTemplates(updatedTemplates);
    } catch (error) {
      console.error("Failed to refresh templates:", error);
    }
  };

  return (
    <>
      {/* Top Tabs - styled like reference image */}
      <div className="mb-6">
        <div className="flex gap-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              setActiveTab("dashboard");
              setSelectedFocus(null);
            }}
            className={`pb-3 text-sm font-bold uppercase tracking-wide transition-colors relative ${
              activeTab === "dashboard"
                ? "text-red-600 dark:text-red-500"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Dashboard
            {activeTab === "dashboard" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 dark:bg-red-500" />
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab("templates");
              setSelectedFocus(null);
            }}
            className={`pb-3 text-sm font-bold uppercase tracking-wide transition-colors relative ${
              activeTab === "templates"
                ? "text-red-600 dark:text-red-500"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            My Plan
            {activeTab === "templates" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 dark:bg-red-500" />
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab("plans");
              setSelectedFocus(null);
            }}
            className={`pb-3 text-sm font-bold uppercase tracking-wide transition-colors relative ${
              activeTab === "plans"
                ? "text-red-600 dark:text-red-500"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Plans
            {activeTab === "plans" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 dark:bg-red-500" />
            )}
          </button>
        </div>
      </div>

      {/* Dashboard Tab */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* Section Header */}
          <div className="space-y-1">
            <p className="text-xs uppercase font-bold text-red-600 dark:text-red-500 tracking-wide">
              Summary
            </p>
            <h2 className="text-3xl font-black uppercase tracking-tight">
              Template Overview
            </h2>
          </div>

          {/* Stats Card */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Total Templates */}
              <div>
                <div className="text-4xl font-black">{templates.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Templates</div>
              </div>

              {/* System Templates */}
              <div>
                <div className="text-4xl font-black">{systemTemplates.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">System Templates</div>
              </div>

              {/* Custom Templates */}
              <div>
                <div className="text-4xl font-black">{userTemplates.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Custom Templates</div>
              </div>

              {/* This could be enhanced to show actual applied count from logs */}
              <div>
                <div className="text-4xl font-black">0</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Applied This Week</div>
              </div>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full mt-4 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white py-3 text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Create New Template
            </button>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase text-gray-900 dark:text-white">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab("templates")}
                className="w-full flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="font-medium">Browse System Plans</span>
                <span className="text-gray-400">→</span>
              </button>
              <button
                onClick={() => setActiveTab("plans")}
                className="w-full flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="font-medium">Browse Templates</span>
                <span className="text-gray-400">→</span>
              </button>
            </div>
          </div>

          {/* System Health Card */}
          <SystemHealthCard
            systemHealthPercent={systemHealthPercent}
            activeDays={activeDays}
            neutralDays={neutralDays}
            inactiveDays={inactiveDays}
          />

          {/* Monthly Heatmap */}
          {Object.keys(heatmapData).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase text-gray-900 dark:text-white">
                Activity Heatmap
              </h3>
              <HeatmapCalendar
                data={heatmapData}
                year={heatmapYear}
                month={heatmapMonth}
              />
            </div>
          )}
        </div>
      )}

      {/* My Plan & Plans Tabs */}
      {(activeTab === "templates" || activeTab === "plans") && (
        <div className="space-y-6">
          {/* Header with Create Button */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {activeTab === "templates" ? "My Plan" : "Plans"}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {activeTab === "templates"
                  ? "Apply momentum-focused task sets to jumpstart your day"
                  : "Browse and manage your custom task templates"}
              </p>
            </div>
            {activeTab === "plans" && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex-shrink-0 rounded-lg bg-blue-600 dark:bg-blue-700 text-white px-4 py-2.5 text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-800 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                + Create
              </button>
            )}
          </div>

          {/* Focus area filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedFocus(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedFocus === null
                  ? "bg-blue-600 text-white dark:bg-blue-500"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              All
            </button>
            {GOAL_FOCUS_AREAS.map((focus) => (
              <button
                key={focus}
                onClick={() => setSelectedFocus(focus)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedFocus === focus
                    ? "bg-blue-600 text-white dark:bg-blue-500"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {focus}
              </button>
            ))}
          </div>

          {/* Templates grid */}
          <section className="space-y-4">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-300 font-medium">
                  {activeTab === "plans"
                    ? "No custom templates yet."
                    : "No templates found for this focus area."}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  {activeTab === "plans"
                    ? "Create your first custom template to get started."
                    : "Try selecting a different category or view all templates."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTemplates.map((template) => (
                  <GoalTemplateCard
                    key={template.id}
                    template={template}
                    taskCount={
                      templates.find((t) => t.id === template.id)?.description
                        ? // Rough estimate - we'll get exact count on preview
                          2
                        : 1
                    }
                    isUserTemplate={template.created_by !== null}
                    onApply={() => handlePreview(template.id)}
                    isApplying={isApplying && previewTemplate?.id === template.id}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Preview modal */}
      {previewTemplate && (
        <GoalTemplatePreview
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onApply={handleApply}
          isApplying={isApplying}
        />
      )}

      {/* Create Template Modal */}
      <CreateTemplateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleTemplateCreated}
      />

      {/* Notification toast */}
      {notification && (
        <div
          className={`fixed bottom-4 right-4 max-w-sm px-4 py-3 rounded-lg shadow-lg text-white font-medium ${
            notification.type === "success"
              ? "bg-green-600 dark:bg-green-500"
              : "bg-red-600 dark:bg-red-500"
          }`}
        >
          {notification.message}
        </div>
      )}
    </>
  );
}
