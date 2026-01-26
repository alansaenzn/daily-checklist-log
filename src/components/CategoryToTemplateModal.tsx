"use client";

import { useState, useEffect } from "react";
import { createGoalTemplate } from "@/app/actions/goal-templates";
import { GOAL_FOCUS_AREAS } from "@/lib/task-types";

interface TaskTemplate {
  id: string;
  title: string;
  category: string;
}

interface CategoryToTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CategoryToTemplateModal({
  isOpen,
  onClose,
  onSuccess,
}: CategoryToTemplateModalProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [tasksByCategory, setTasksByCategory] = useState<Record<string, TaskTemplate[]>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [focusArea, setFocusArea] = useState<string>(GOAL_FOCUS_AREAS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch categories and tasks on modal open
  useEffect(() => {
    if (isOpen) {
      fetchCategoriesAndTasks();
    }
  }, [isOpen]);

  const fetchCategoriesAndTasks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/categories-with-tasks');
      if (response.ok) {
        const data = await response.json();
        const grouped: Record<string, TaskTemplate[]> = {};
        
        data.tasks.forEach((task: TaskTemplate) => {
          const cat = task.category || "Uncategorized";
          if (!grouped[cat]) {
            grouped[cat] = [];
          }
          grouped[cat].push(task);
        });

        // Also fetch custom categories from localStorage
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

        // Add custom categories even if they don't have tasks
        customCategories.forEach(cat => {
          if (!grouped[cat]) {
            grouped[cat] = [];
          }
        });

        setTasksByCategory(grouped);
        const cats = Object.keys(grouped).sort();
        setCategories(cats);
        if (cats.length > 0 && !selectedCategory) {
          setSelectedCategory(cats[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setError('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const selectAllInCategory = () => {
    if (!selectedCategory) return;
    const categoryTasks = tasksByCategory[selectedCategory] || [];
    setSelectedTaskIds(new Set(categoryTasks.map(t => t.id)));
  };

  const deselectAllInCategory = () => {
    if (!selectedCategory) return;
    const categoryTasks = tasksByCategory[selectedCategory] || [];
    const taskIds = new Set(categoryTasks.map(t => t.id));
    setSelectedTaskIds(prev => {
      const next = new Set(prev);
      taskIds.forEach(id => next.delete(id));
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!templateName.trim()) {
      setError("Template name is required");
      return;
    }

    if (selectedTaskIds.size === 0) {
      setError("Select at least one task");
      return;
    }

    setIsSubmitting(true);
    try {
      // Get selected tasks
      const selectedTasks = Object.values(tasksByCategory)
        .flat()
        .filter(t => selectedTaskIds.has(t.id));

      await createGoalTemplate(
        templateName.trim(),
        templateDescription.trim() || null,
        focusArea,
        selectedTasks.map(t => ({
          title: t.title,
          category: t.category,
        }))
      );

      onSuccess();
      
      // Reset form
      setTemplateName("");
      setTemplateDescription("");
      setFocusArea(GOAL_FOCUS_AREAS[0]);
      setSelectedTaskIds(new Set());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create template");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentCategoryTasks = tasksByCategory[selectedCategory] || [];
  const selectedInCategory = currentCategoryTasks.filter(t => selectedTaskIds.has(t.id)).length;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-lg w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Create Template from Categories
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            disabled={isSubmitting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-800 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Template Info Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Template Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., My Productive Morning"
                className="w-full rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white p-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Describe what this template is for..."
                rows={2}
                className="w-full rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white p-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Focus Area
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
          </div>

          {/* Category Selector & Task Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Tasks from Categories
              </label>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {selectedTaskIds.size} selected
              </span>
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Loading tasks...
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No tasks found. Create some tasks first.
              </div>
            ) : (
              <>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white p-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSubmitting}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat} ({tasksByCategory[cat]?.length || 0} tasks)
                    </option>
                  ))}
                </select>

                {currentCategoryTasks.length > 0 ? (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {selectedCategory}
                      </h3>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={selectAllInCategory}
                          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 px-2 py-1 rounded"
                          disabled={isSubmitting}
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={deselectAllInCategory}
                          className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 px-2 py-1 rounded"
                          disabled={isSubmitting}
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {currentCategoryTasks.map((task) => (
                        <label
                          key={task.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTaskIds.has(task.id)}
                            onChange={() => toggleTaskSelection(task.id)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            disabled={isSubmitting}
                          />
                          <span className="flex-1 text-sm text-gray-900 dark:text-white">
                            {task.title}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No tasks in <span className="font-semibold">{selectedCategory}</span> category.
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      Create tasks in this category to add them to templates.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-3 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-blue-600 dark:bg-blue-700 text-white px-4 py-3 font-medium hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={isSubmitting || selectedTaskIds.size === 0}
            >
              {isSubmitting ? "Creating..." : `Create Template (${selectedTaskIds.size} tasks)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
