"use client";

import { useState, useEffect } from "react";
import { createGoalTemplate } from "@/app/actions/goal-templates";
import { GOAL_FOCUS_AREAS, TASK_CATEGORIES } from "@/lib/task-types";

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTemplate: any) => void;
  existingCategories?: string[];
}

interface TaskInput {
  id: string;
  title: string;
  category: string;
  customCategory?: string;
  description: string;
  duration: string;
}

export function CreateTemplateModal({
  isOpen,
  onClose,
  onSuccess,
  existingCategories = [],
}: CreateTemplateModalProps) {
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [focusArea, setFocusArea] = useState<string>(GOAL_FOCUS_AREAS[0]);
  const [tasks, setTasks] = useState<TaskInput[]>([
    { id: "1", title: "", category: TASK_CATEGORIES[0], description: "", duration: "" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allCategories, setAllCategories] = useState<string[]>([]);

  // Merge static categories with existing/custom categories
  useEffect(() => {
    const customCategories: string[] = [];
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('task-categories-custom');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            customCategories.push(...parsed);
          }
        }
      } catch (e) {
        console.error('Failed to load custom categories:', e);
      }
    }

    const merged = [
      ...TASK_CATEGORIES,
      ...customCategories.filter((cat) => !TASK_CATEGORIES.includes(cat as any)),
      ...existingCategories.filter(
        (cat) => !TASK_CATEGORIES.includes(cat as any) && !customCategories.includes(cat)
      ),
    ];
    setAllCategories(merged);
  }, [existingCategories, isOpen]);

  if (!isOpen) return null;

  const handleAddTask = () => {
    const newId = Math.max(...tasks.map((t) => parseInt(t.id) || 0), 0) + 1;
    setTasks([
      ...tasks,
      {
        id: newId.toString(),
        title: "",
        category: TASK_CATEGORIES[0],
        customCategory: "",
        description: "",
        duration: "",
      },
    ]);
  };

  const handleRemoveTask = (id: string) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter((t) => t.id !== id));
    }
  };

  const handleTaskChange = (
    id: string,
    field: keyof TaskInput,
    value: string
  ) => {
    setTasks(
      tasks.map((t) =>
        t.id === id ? { ...t, [field]: value } : t
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!templateName.trim()) {
      setError("List name is required");
      return;
    }

    const validTasks = tasks.filter((t) => t.title.trim());
    if (validTasks.length === 0) {
      setError("Add at least one task to the list");
      return;
    }

    setIsSubmitting(true);
    try {
      // Process custom categories and save to localStorage
      const processedTasks = validTasks.map((t) => {
        let finalCategory = t.category;
        if (t.category === "Custom" && t.customCategory?.trim()) {
          finalCategory = t.customCategory.trim();
          // Save to localStorage if not already there
          if (typeof window !== 'undefined') {
            try {
              const stored = localStorage.getItem('task-categories-custom');
              const customCategories: string[] = stored ? JSON.parse(stored) : [];
              if (!customCategories.includes(finalCategory) && !TASK_CATEGORIES.includes(finalCategory as any)) {
                customCategories.push(finalCategory);
                localStorage.setItem('task-categories-custom', JSON.stringify(customCategories));
              }
            } catch (e) {
              console.error('Failed to save custom category:', e);
            }
          }
        }
        return {
          title: t.title,
          description: t.description || undefined,
          category: finalCategory,
          estimatedDurationMinutes: t.duration ? parseInt(t.duration) : undefined,
        };
      });

      const result = await createGoalTemplate(
        templateName,
        templateDescription || null,
        focusArea,
        processedTasks
      );

      onSuccess(result);
      
      // Reset form
      setTemplateName("");
      setTemplateDescription("");
      setFocusArea(GOAL_FOCUS_AREAS[0]);
      setTasks([
        { id: "1", title: "", category: TASK_CATEGORIES[0], customCategory: "", description: "", duration: "" },
      ]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create template");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-lg w-full sm:max-w-xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Create List
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Template Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              List Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., Morning Routine, Deep Work Block"
              className="w-full rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white p-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              placeholder="Describe what this list is for..."
              rows={2}
              className="w-full rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white p-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
            />
          </div>

          {/* Focus Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Focus Area <span className="text-red-500">*</span>
            </label>
            <select
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white p-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
            >
              {GOAL_FOCUS_AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          {/* Tasks Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tasks <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAddTask}
                disabled={isSubmitting}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 px-2 py-1 rounded"
              >
                + Add Task
              </button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2"
                >
                  {/* Task Title */}
                  <input
                    type="text"
                    value={task.title}
                    onChange={(e) => handleTaskChange(task.id, "title", e.target.value)}
                    placeholder="Task title"
                    className="w-full rounded border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSubmitting}
                  />

                  {/* Task Category & Duration */}
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={task.category}
                      onChange={(e) => handleTaskChange(task.id, "category", e.target.value)}
                      className="rounded border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isSubmitting}
                    >
                      {allCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="Custom">Custom...</option>
                    </select>
                    <input
                      type="number"
                      value={task.duration}
                      onChange={(e) => handleTaskChange(task.id, "duration", e.target.value)}
                      placeholder="Duration (min)"
                      min="0"
                      className="rounded border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Custom Category Input */}
                  {task.category === "Custom" && (
                    <input
                      type="text"
                      value={task.customCategory || ""}
                      onChange={(e) => handleTaskChange(task.id, "customCategory", e.target.value)}
                      placeholder="Enter custom category name"
                      className="w-full rounded border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isSubmitting}
                    />
                  )}

                  {/* Task Description */}
                  <input
                    type="text"
                    value={task.description}
                    onChange={(e) => handleTaskChange(task.id, "description", e.target.value)}
                    placeholder="Task description (optional)"
                    className="w-full rounded border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSubmitting}
                  />

                  {/* Remove Task Button */}
                  {tasks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTask(task.id)}
                      disabled={isSubmitting}
                      className="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white py-2.5 px-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-blue-600 dark:bg-blue-700 text-white py-2.5 px-3 text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Creating..." : "Create List"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
