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
}: TaskDetailsPreviewProps) {
  const formattedDueDate = formatDueDate(dueDate);

  const scheduleParts: string[] = [];
  if (formattedDueDate) scheduleParts.push(formattedDueDate);
  if (dueTime) scheduleParts.push(dueTime);
  if (taskType === "recurring") scheduleParts.push("Repeats");

  const hasMetaRow = Boolean(projectName || category || priorityLabel || scheduleParts.length > 0 || (tags && tags.length));
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
            <div className="grid gap-3 sm:grid-cols-2">
              {projectName && (
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Project</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{projectName}</p>
                </div>
              )}
              {category && (
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Category</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{category}</p>
                </div>
              )}
              {priorityLabel && (
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Priority</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{priorityLabel}</p>
                </div>
              )}
              {scheduleParts.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Schedule</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{scheduleParts.join(" • ")}</p>
                </div>
              )}
              {tags && tags.length > 0 && (
                <div className="space-y-1 sm:col-span-2">
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
