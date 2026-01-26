"use client";

import { useState, useEffect } from "react";
import { createTaskTemplate } from "@/app/actions/tasks";
import { TASK_CATEGORIES } from "@/lib/task-types";

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingCategories?: string[];
}

interface TaskInput {
  id: string;
  title: string;
  category: string;
}

export function CreateListModal({
  isOpen,
  onClose,
  onSuccess,
  existingCategories = [],
}: CreateListModalProps) {
  const [listName, setListName] = useState("");
  const [tasksByCategory, setTasksByCategory] = useState<Record<string, TaskInput[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

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
    if (merged.length > 0 && !selectedCategory) {
      setSelectedCategory(merged[0]);
    }
  }, [existingCategories, isOpen, selectedCategory]);

  if (!isOpen) return null;

  const handleAddTaskToCategory = (category: string) => {
    const newId = String(Date.now());
    setTasksByCategory(prev => ({
      ...prev,
      [category]: [
        ...(prev[category] || []),
        { id: newId, title: "", category }
      ]
    }));
  };

  const handleRemoveTask = (category: string, taskId: string) => {
    setTasksByCategory(prev => ({
      ...prev,
      [category]: (prev[category] || []).filter(t => t.id !== taskId)
    }));
  };

  const handleTaskTitleChange = (category: string, taskId: string, title: string) => {
    setTasksByCategory(prev => ({
      ...prev,
      [category]: (prev[category] || []).map(t =>
        t.id === taskId ? { ...t, title } : t
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!listName.trim()) {
      setError("List name is required");
      return;
    }

    // Get all valid tasks across all categories
    const allTasks = Object.values(tasksByCategory)
      .flat()
      .filter(t => t.title.trim());

    if (allTasks.length === 0) {
      setError("Add at least one task to the list");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create each task with the list name
      for (const task of allTasks) {
        const formData = new FormData();
        formData.append("title", task.title.trim());
        formData.append("category", task.category);
        formData.append("task_type", "recurring");
        formData.append("list_name", listName.trim());
        
        await createTaskTemplate(formData);
      }

      onSuccess();
      
      // Reset form
      setListName("");
      setTasksByCategory({});
      setSelectedCategory(allCategories[0] || "");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create list");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalTasks = Object.values(tasksByCategory)
    .flat()
    .filter(t => t.title.trim()).length;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-lg w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Create List
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

          {/* List Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              List Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="e.g., Weekly Goals, Morning Routine"
              className="w-full rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white p-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Add Tasks by Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white p-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
            >
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Tasks by Category */}
          <div className="space-y-4">
            {allCategories.map((category) => {
              const categoryTasks = tasksByCategory[category] || [];
              if (categoryTasks.length === 0 && category !== selectedCategory) return null;

              return (
                <div
                  key={category}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {category}
                      {categoryTasks.filter(t => t.title.trim()).length > 0 && (
                        <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                          ({categoryTasks.filter(t => t.title.trim()).length})
                        </span>
                      )}
                    </h3>
                    {category === selectedCategory && (
                      <button
                        type="button"
                        onClick={() => handleAddTaskToCategory(category)}
                        className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 px-2 py-1 rounded"
                        disabled={isSubmitting}
                      >
                        + Add Task
                      </button>
                    )}
                  </div>

                  {categoryTasks.length > 0 && (
                    <div className="space-y-2">
                      {categoryTasks.map((task) => (
                        <div key={task.id} className="flex gap-2">
                          <input
                            type="text"
                            value={task.title}
                            onChange={(e) => handleTaskTitleChange(category, task.id, e.target.value)}
                            placeholder="Task title"
                            className="flex-1 rounded border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={isSubmitting}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveTask(category, task.id)}
                            className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 p-2"
                            disabled={isSubmitting}
                            aria-label="Remove task"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {categoryTasks.length === 0 && category === selectedCategory && (
                    <button
                      type="button"
                      onClick={() => handleAddTaskToCategory(category)}
                      className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      disabled={isSubmitting}
                    >
                      + Add first task to {category}
                    </button>
                  )}
                </div>
              );
            })}
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
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : `Create List${totalTasks > 0 ? ` (${totalTasks} tasks)` : ""}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
