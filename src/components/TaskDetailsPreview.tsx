"use client";

import React from "react";
import { type TaskType } from "@/lib/task-types";

interface TaskDetailsPreviewProps {
  id: string;
  isOpen: boolean;
  category?: string | null;
  projectName?: string | null;
  taskType: TaskType;
  dueDate?: string | null;
  dueTime?: string | null;
  notes?: string | null;
  details?: string | null;
  tags?: string[] | null;
  priorityLabel?: string | null;
  difficultyLevel?: number | null;
}

function formatDueDate(dueDate?: string | null) {
  if (!dueDate) return null;
  const parsed = new Date(dueDate);
  if (Number.isNaN(parsed.getTime())) return dueDate;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function TaskDetailsPreview({
  id,
  isOpen,
  category,
  projectName,
  taskType,
  dueDate,
  dueTime,
  notes,
  details,
  tags,
  priorityLabel,
  difficultyLevel,
}: TaskDetailsPreviewProps) {
  const formattedDueDate = formatDueDate(dueDate);

  const scheduleParts: string[] = [];
  if (formattedDueDate) scheduleParts.push(formattedDueDate);
  if (dueTime) scheduleParts.push(dueTime);
  if (taskType === "recurring") scheduleParts.push("Repeats");

  const hasMetaRow = Boolean(projectName || category || (tags && tags.length));
  const hasBody = Boolean(notes || details);
  const hasContent = hasMetaRow || hasBody;

  return (
    <div
      id={id}
      role="region"
      aria-hidden={!isOpen}
      style={{ maxHeight: isOpen && hasContent ? "2000px" : "0px" }}
      className={`overflow-hidden transition-[max-height,opacity,transform] duration-200 ease-in-out ${
        isOpen && hasContent ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
      }`}
    >
      {hasContent && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/70 p-3 sm:p-4 space-y-3">
          {hasMetaRow && (
            <div className="space-y-3">
              {category && (
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Category</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{category}</p>
                </div>
              )}

              {/* Pill row: Priority, Difficulty */}
              {(priorityLabel || typeof difficultyLevel === "number") && (
                <div className="flex items-center gap-2 flex-wrap">
                  {priorityLabel && (
                    <>
                      <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium">Priority</span>
                      <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
                        {priorityLabel}
                      </span>
                    </>
                  )}
                  {typeof difficultyLevel === "number" && (() => {
                    const level = Math.max(1, Math.min(5, Math.floor(difficultyLevel)));
                    const label = level <= 2 ? "Easy" : level === 3 ? "Medium" : level === 4 ? "Hard" : "Very Hard";
                    const cls = level <= 2
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-200"
                      : level === 3
                        ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-200"
                        : level === 4
                          ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200"
                          : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-200";
                    return (
                      <>
                        <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium">Activity level</span>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>
                          {label}
                        </span>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Due date as simple text */}
              {formattedDueDate && (
                <p className="text-sm text-gray-700 dark:text-gray-300">Due {formattedDueDate}</p>
              )}

              {projectName && (
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Project</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{projectName}</p>
                </div>
              )}

              {tags && tags.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {hasBody && (
            <div className="space-y-2 text-sm text-gray-800 dark:text-gray-200">
              {notes && (
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Notes</p>
                  <p className="leading-relaxed whitespace-pre-wrap break-words">
                    {notes}
                  </p>
                </div>
              )}
              {details && (
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Details</p>
                  <p className="leading-relaxed whitespace-pre-wrap break-words">
                    {details}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
