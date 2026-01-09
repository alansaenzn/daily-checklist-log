/**
 * TemplatesView
 * 
 * Unified templates page with segmented control for:
 * - Recommended: System templates (apply-focused, read-only)
 * - My Templates: User-created templates (editable, duplicable, deletable)
 */

"use client";

import { useState, useMemo } from "react";
import { GoalTemplate } from "@/lib/task-types";
import { GoalTemplateCard } from "@/components/GoalTemplateCard";
import { GoalTemplatePreview } from "@/components/GoalTemplatePreview";
import { CreateTemplateModal } from "@/components/CreateTemplateModal";
import { GOAL_FOCUS_AREAS } from "@/lib/task-types";
import {
  getGoalTemplateWithTasks,
  applyGoalTemplate,
  getGoalTemplates,
} from "@/app/actions/goal-templates";
import type { GoalTemplateWithTasks } from "@/lib/task-types";

interface TemplatesViewProps {
  templates: GoalTemplate[];
}

type SegmentType = "recommended" | "my-templates";

export function TemplatesView({
  templates: initialTemplates,
}: TemplatesViewProps) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [activeSegment, setActiveSegment] = useState<SegmentType>("recommended");
  const [selectedFocus, setSelectedFocus] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] =
    useState<GoalTemplateWithTasks | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Separate system templates (Recommended) from user templates (My Templates)
  const systemTemplates = useMemo(
    () => templates.filter((t) => t.is_system),
    [templates]
  );

  const userTemplates = useMemo(
    () => templates.filter((t) => !t.is_system),
    [templates]
  );

  // Current view templates based on active segment
  const currentTemplates = useMemo(() => {
    if (activeSegment === "recommended") return systemTemplates;
    if (activeSegment === "my-templates") return userTemplates;
    return [];
  }, [activeSegment, systemTemplates, userTemplates]);

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

  const handleTemplateCreated = async () => {
    showNotification("success", "✓ Template created!");

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
      {/* Preview Modal */}
      {previewTemplate && (
        <GoalTemplatePreview
          template={previewTemplate}
          onApply={handleApply}
          onClose={() => setPreviewTemplate(null)}
          isApplying={isApplying}
        />
      )}

      {/* Create Template Modal */}
      {isCreateModalOpen && (
        <CreateTemplateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleTemplateCreated}
        />
      )}

      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed bottom-24 left-4 right-4 rounded-lg px-4 py-3 text-white font-medium text-sm shadow-lg ${
            notification.type === "success"
              ? "bg-green-600 dark:bg-green-700"
              : "bg-red-600 dark:bg-red-700"
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="space-y-6">
        {/* Header with Segment Control */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black uppercase tracking-tight">
              Templates
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {activeSegment === "recommended"
                ? "System templates designed for momentum"
                : "Templates you've created"}
            </p>
          </div>

          {/* Segmented Control */}
          <div className="flex gap-2 rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
            <button
              onClick={() => {
                setActiveSegment("recommended");
                setSelectedFocus(null);
              }}
              className={`flex-1 rounded-md py-2 px-3 text-sm font-medium transition-colors ${
                activeSegment === "recommended"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Recommended
            </button>
            <button
              onClick={() => {
                setActiveSegment("my-templates");
                setSelectedFocus(null);
              }}
              className={`flex-1 rounded-md py-2 px-3 text-sm font-medium transition-colors ${
                activeSegment === "my-templates"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              My Templates
            </button>
          </div>
        </div>

        {/* Create Button (only for My Templates) */}
        {activeSegment === "my-templates" && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full rounded-lg bg-blue-600 dark:bg-blue-700 text-white font-medium py-3 hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            + Create Template
          </button>
        )}

        {/* Focus Area Filters */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase text-gray-900 dark:text-white tracking-wide">
            Filter by Focus
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedFocus(null)}
              className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                selectedFocus === null
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              All
            </button>
            {GOAL_FOCUS_AREAS.map((area) => (
              <button
                key={area}
                onClick={() => setSelectedFocus(area)}
                className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                  selectedFocus === area
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              {activeSegment === "recommended"
                ? "No templates match your filter"
                : "You haven't created any templates yet"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTemplates.map((template) => (
              <GoalTemplateCard
                key={template.id}
                template={template}
                taskCount={0}
                onPreview={() => handlePreview(template.id)}
                onApply={() => handlePreview(template.id)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
