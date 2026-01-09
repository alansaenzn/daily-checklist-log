/**
 * GoalTemplateCard
 * 
 * Displays a goal template summary with focus area, task count, and preview button.
 * Simple, clean card design that emphasizes the focus area and ease of application.
 */

import { GoalTemplate } from "@/lib/task-types";

interface GoalTemplateCardProps {
  template: GoalTemplate;
  taskCount: number;
  onPreview: () => void;
  onApply: () => void;
  isApplying?: boolean;
}

export function GoalTemplateCard({
  template,
  taskCount,
  onPreview,
  onApply,
  isApplying = false,
}: GoalTemplateCardProps) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{template.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {template.description}
          </p>
        </div>
        
        {/* Focus area badge */}
        <div className="ml-2 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium whitespace-nowrap">
          {template.focus_area}
        </div>
      </div>

      {/* Task count */}
      <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
        {taskCount} {taskCount === 1 ? "task" : "tasks"}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onPreview}
          className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Preview
        </button>
        <button
          onClick={onApply}
          disabled={isApplying}
          className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isApplying ? "Applying..." : "Apply"}
        </button>
      </div>
    </div>
  );
}
