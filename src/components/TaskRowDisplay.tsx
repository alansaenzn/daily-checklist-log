"use client";

import React from "react";

export type TaskData = {
  id: string;
  title: string;
  category: string | null;
  task_type: string;
  is_active: boolean;
  created_at?: string | null;
  due_date: string | null;
  due_time: string | null;
  list_name: string | null;
  project_id: string | null;
  priority?: string | null;
  difficulty?: number | null;
  notes?: string | null;
  url?: string | null;
  details?: string | null;
  archived_at?: string | null;
};

interface TaskRowDisplayProps {
  task: TaskData;
  onClick?: () => void;
  showProject?: boolean;
  onManage?: () => void;
}

// Compact task pill used in project accordion
export function TaskRowDisplay({ task, onClick, onManage, showProject = false }: TaskRowDisplayProps) {
  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-3 hover:border-blue-500 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={onClick}
          className="flex-1 min-w-0 text-left"
          aria-label={`Open task ${task.title}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {task.title}
            </span>
            {task.category && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                {task.category}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 flex-wrap">
            <span className="capitalize">{task.task_type === "one_off" ? "One-off" : "Recurring"}</span>
            {task.due_date && <span>Due {task.due_date}</span>}
            {task.due_time && <span>{task.due_time}</span>}
            {showProject && task.list_name && <span>{task.list_name}</span>}
          </div>
        </button>

        <div className="flex flex-col items-end gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {task.is_active ? "Active" : "Paused"}
          </span>
          {onManage && (
            <button
              type="button"
              onClick={onManage}
              // Task-level control keeps management scoped to this task instead of the whole project header
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 sm:px-3 sm:py-1.5"
              aria-label={`Manage task ${task.title}`}
            >
              <span className="hidden sm:inline">Task management</span>
              <span className="sm:hidden">Manage</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
