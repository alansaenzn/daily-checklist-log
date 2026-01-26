/**
 * TemplatesView
 * 
 * Unified templates page with segmented control for:
 * - Recommended: System templates (apply-focused, read-only)
 * - My Templates: User-created templates (editable, duplicable, deletable)
 */

"use client";

import { useState, useMemo, useEffect } from "react";
import { GoalTemplate } from "@/lib/task-types";
import { GoalTemplateCard } from "@/components/GoalTemplateCard";
import { GoalTemplatePreview } from "@/components/GoalTemplatePreview";
import { CreateTemplateModal } from "@/components/CreateTemplateModal";
import { CategoryToTemplateModal } from "@/components/CategoryToTemplateModal";
import { TASK_CATEGORIES } from "@/lib/task-types";
import { createTaskTemplate } from "@/app/actions/tasks";
import {
  getGoalTemplateWithTasks,
  applyGoalTemplate,
  getGoalTemplates,
} from "@/app/actions/goal-templates";
import type { GoalTemplateWithTasks } from "@/lib/task-types";

interface TemplatesViewProps {
  templates: GoalTemplate[];
}

type SegmentType = "recommended" | "my-templates" | "quick-add";

export function TemplatesView({
  templates: initialTemplates,
}: TemplatesViewProps) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [activeSegment, setActiveSegment] = useState<SegmentType>("recommended");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] =
    useState<GoalTemplateWithTasks | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCategoryToTemplateModalOpen, setIsCategoryToTemplateModalOpen] = useState(false);
  const [templateTaskCounts, setTemplateTaskCounts] = useState<Record<string, number>>({});
  const [templateCategories, setTemplateCategories] = useState<Record<string, Set<string>>>({});
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  
  // Quick add task state
  const [quickAddInputs, setQuickAddInputs] = useState<Record<string, string>>({});
  const [addingToCategory, setAddingToCategory] = useState<string | null>(null);
  const [existingCategories, setExistingCategories] = useState<string[]>([]);

  // Fetch existing categories from user's task templates
  useEffect(() => {
    if (isCreateModalOpen) {
      const fetchCategories = async () => {
        try {
          const response = await fetch('/api/categories');
          if (response.ok) {
            const data = await response.json();
            setExistingCategories(data.categories || []);
          }
        } catch (error) {
          console.error('Failed to fetch categories:', error);
        }
      };
      fetchCategories();
    }
  }, [isCreateModalOpen]);

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

  // Filter templates by category (checks if any task in the template has the selected category)
  const filteredTemplates = selectedCategory
    ? currentTemplates.filter((t) => {
        const categories = templateCategories[t.id];
        return categories && categories.has(selectedCategory);
      })
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
      // Refresh task counts for new templates
      await fetchTaskCounts(updatedTemplates);
    } catch (error) {
      console.error("Failed to refresh templates:", error);
    }
  };

  const handleQuickAddTask = async (category: string) => {
    const title = quickAddInputs[category]?.trim();
    if (!title) return;

    setAddingToCategory(category);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("category", category);
      formData.append("task_type", "recurring");

      await createTaskTemplate(formData);
      
      // Clear input
      setQuickAddInputs(prev => ({ ...prev, [category]: "" }));
      
      showNotification("success", `✓ Added "${title}" to ${category}`);
    } catch (error) {
      showNotification(
        "error",
        error instanceof Error ? error.message : "Failed to create task"
      );
    } finally {
      setAddingToCategory(null);
    }
  };

  // Fetch task counts for all templates
  const fetchTaskCounts = async (templatesData: GoalTemplate[]) => {
    const counts: Record<string, number> = {};
    const categories: Record<string, Set<string>> = {};
    try {
      await Promise.all(
        templatesData.map(async (template) => {
          try {
            const templateWithTasks = await getGoalTemplateWithTasks(template.id);
            counts[template.id] = templateWithTasks.tasks.length;
            
            // Collect unique categories from all tasks in this template
            const categorySet = new Set<string>();
            templateWithTasks.tasks.forEach(task => {
              if (task.category) {
                categorySet.add(task.category);
              }
            });
            categories[template.id] = categorySet;
          } catch (error) {
            console.error(`Failed to fetch tasks for template ${template.id}:`, error);
            counts[template.id] = 0;
            categories[template.id] = new Set();
          }
        })
      );
      setTemplateTaskCounts(counts);
      setTemplateCategories(categories);
    } catch (error) {
      console.error("Failed to fetch task counts:", error);
    }
  };

  // Fetch task counts on mount
  useEffect(() => {
    fetchTaskCounts(templates);
  }, []);

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
          existingCategories={existingCategories}
        />
      )}

      {/* Category to Template Modal */}
      {isCategoryToTemplateModalOpen && (
        <CategoryToTemplateModal
          isOpen={isCategoryToTemplateModalOpen}
          onClose={() => setIsCategoryToTemplateModalOpen(false)}
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
                : activeSegment === "my-templates"
                ? "Templates you've created"
                : "Quickly add tasks by category"}
            </p>
          </div>

          {/* Segmented Control */}
          <div className="flex gap-2 rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
            <button
              onClick={() => {
                setActiveSegment("recommended");
                setSelectedCategory(null);
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
                setSelectedCategory(null);
              }}
              className={`flex-1 rounded-md py-2 px-3 text-sm font-medium transition-colors ${
                activeSegment === "my-templates"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              My Templates
            </button>
            <button
              onClick={() => {
                setActiveSegment("quick-add");
                setSelectedCategory(null);
              }}
              className={`flex-1 rounded-md py-2 px-3 text-sm font-medium transition-colors ${
                activeSegment === "quick-add"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Quick Add
            </button>
          </div>
        </div>

        {/* Quick Add Section */}
        {activeSegment === "quick-add" && (
          <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
              <p className="text-sm text-blue-900 dark:text-blue-300">
                💡 Quickly add individual tasks to your categories. Tasks will be added as recurring tasks.
              </p>
            </div>

            <div className="space-y-3">
              {TASK_CATEGORIES.map((category) => (
                <div
                  key={category}
                  className="rounded-lg border-2 border-gray-200 dark:border-gray-700 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {category}
                    </h3>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={`Add a task to ${category}...`}
                      value={quickAddInputs[category] || ""}
                      onChange={(e) =>
                        setQuickAddInputs(prev => ({ ...prev, [category]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleQuickAddTask(category);
                        }
                      }}
                      disabled={addingToCategory === category}
                      className="flex-1 rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    />
                    <button
                      onClick={() => handleQuickAddTask(category)}
                      disabled={!quickAddInputs[category]?.trim() || addingToCategory === category}
                      className="rounded-lg bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {addingToCategory === category ? "Adding..." : "+ Add"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Buttons (only for My Templates) */}
        {activeSegment === "my-templates" && (
          <div className="space-y-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-medium">Create New Template</span>
            </button>
            <button
              onClick={() => setIsCategoryToTemplateModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span className="font-medium">Create from Categories</span>
            </button>
          </div>
        )}

        {/* Category Filters (only for template views) */}
        {activeSegment !== "quick-add" && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase text-gray-900 dark:text-white tracking-wide">
            Filter by Category
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                selectedCategory === null
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              All
            </button>
            {TASK_CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                  selectedCategory === category
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        )}

        {/* Templates List (only for template views) */}
        {activeSegment !== "quick-add" && (
        filteredTemplates.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              {activeSegment === "recommended"
                ? "No templates match your filter"
                : "You haven't created any templates yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTemplates.map((template) => (
              <GoalTemplateCard
                key={template.id}
                template={template}
                taskCount={templateTaskCounts[template.id] || 0}
                isUserTemplate={!template.is_system}
                onApply={async () => {
                  setIsApplying(true);
                  try {
                    const result = await applyGoalTemplate(template.id);
                    showNotification(
                      "success",
                      `✓ Applied "${result.templateName}" with ${result.templatesCreated} tasks!`
                    );
                  } catch (error) {
                    showNotification(
                      "error",
                      error instanceof Error ? error.message : "Failed to apply template"
                    );
                  } finally {
                    setIsApplying(false);
                  }
                }}
                onTemplateDeleted={async () => {
                  // Refresh templates list
                  try {
                    const updatedTemplates = await getGoalTemplates();
                    setTemplates(updatedTemplates);
                    await fetchTaskCounts(updatedTemplates);
                    showNotification("success", "✓ Template deleted");
                  } catch (error) {
                    console.error("Failed to refresh templates:", error);
                  }
                }}
                onTemplateUpdated={async () => {
                  // Refresh templates list and task counts
                  try {
                    const updatedTemplates = await getGoalTemplates();
                    setTemplates(updatedTemplates);
                    await fetchTaskCounts(updatedTemplates);
                  } catch (error) {
                    console.error("Failed to refresh templates:", error);
                  }
                }}
                isApplying={isApplying}
              />
            ))}
          </div>
        )
        )}
      </div>
    </>
  );
}
