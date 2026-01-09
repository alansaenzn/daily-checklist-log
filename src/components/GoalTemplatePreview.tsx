/**
 * GoalTemplatePreview
 * 
 * Modal/overlay showing detailed preview of a goal template with all its tasks.
 * Emphasizes low friction and achievable tasks (momentum-first).
 */

"use client";

import { GoalTemplateWithTasks } from "@/lib/task-types";

interface GoalTemplatePreviewProps {
  template: GoalTemplateWithTasks;
  onClose: () => void;
  onApply: () => void;
  isApplying?: boolean;
}

export function GoalTemplatePreview({
  template,
  onClose,
  onApply,
  isApplying = false,
}: GoalTemplatePreviewProps) {
  const totalDuration =
    template.tasks.reduce((sum, task) => {
      return sum + (task.estimated_duration_minutes || 0);
    }, 0) || null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {template.name}
              </h2>
              <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
                {template.focus_area}
              </span>
            </div>
            {template.description && (
              <p className="text-gray-600 dark:text-gray-400 text-sm">{template.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close preview"
          >
            <span className="text-gray-500 dark:text-gray-400 text-xl leading-none">×</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">Tasks</div>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                {template.tasks.length}
              </div>
            </div>
            {totalDuration && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">Est. Duration</div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {totalDuration}m
                </div>
              </div>
            )}
          </div>

          {/* Tasks list */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Tasks</h3>
            {template.tasks.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm italic">No tasks in this template</p>
            ) : (
              template.tasks.map((task, index) => (
                <div
                  key={task.id}
                  className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  {/* Task number */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center justify-center font-medium text-sm">
                    {index + 1}
                  </div>

                  {/* Task content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <p className="font-medium text-gray-900 dark:text-white">{task.title}</p>
                      {task.is_optional && (
                        <span className="text-xs px-2 py-0.5 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded">
                          Optional
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {task.description}
                      </p>
                    )}

                    {/* Task metadata */}
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="inline-block px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                        {task.category}
                      </span>
                      {task.estimated_duration_minutes && (
                        <span>~{task.estimated_duration_minutes}m</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Info callout */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              💡 <strong>Tip:</strong> Tasks will be added to your daily checklist as active.
              You can edit, disable, or delete them anytime to match your style.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onApply}
            disabled={isApplying}
            className="flex-1 px-4 py-2 text-white bg-blue-600 dark:bg-blue-500 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isApplying ? "Applying..." : "Apply Template"}
          </button>
        </div>
      </div>
    </div>
  );
}
