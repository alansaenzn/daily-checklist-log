/**
 * Apple Reminders-style priority utility functions and styles
 */

import type { TaskPriority } from "./task-types";

export const PriorityConfig = {
  none: {
    label: "None",
    color: "gray", // Tailwind color
    bgColor: "bg-gray-100 dark:bg-gray-800",
    textColor: "text-gray-700 dark:text-gray-300",
    borderColor: "border-gray-300 dark:border-gray-600",
    ringColor: "focus:ring-gray-500",
    hoverBg: "hover:bg-gray-50 dark:hover:bg-gray-700/50",
    dotColor: "bg-gray-400 dark:bg-gray-500",
  },
  low: {
    label: "Low",
    color: "blue",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    textColor: "text-blue-700 dark:text-blue-300",
    borderColor: "border-blue-300 dark:border-blue-600",
    ringColor: "focus:ring-blue-500",
    hoverBg: "hover:bg-blue-50 dark:hover:bg-blue-800/20",
    dotColor: "bg-blue-500 dark:bg-blue-400",
  },
  medium: {
    label: "Medium",
    color: "orange",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    textColor: "text-orange-700 dark:text-orange-300",
    borderColor: "border-orange-300 dark:border-orange-600",
    ringColor: "focus:ring-orange-500",
    hoverBg: "hover:bg-orange-50 dark:hover:bg-orange-800/20",
    dotColor: "bg-orange-500 dark:bg-orange-400",
  },
  high: {
    label: "High",
    color: "red",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    textColor: "text-red-700 dark:text-red-300",
    borderColor: "border-red-300 dark:border-red-600",
    ringColor: "focus:ring-red-500",
    hoverBg: "hover:bg-red-50 dark:hover:bg-red-800/20",
    dotColor: "bg-red-500 dark:bg-red-400",
  },
} as const;

/**
 * Get the configuration for a priority level
 */
export function getPriorityConfig(priority: TaskPriority) {
  return PriorityConfig[priority];
}

/**
 * Get a color indicator for priority (emoji or dot)
 */
export function getPriorityIndicator(priority: TaskPriority): string {
  switch (priority) {
    case "high":
      return "🔴";
    case "medium":
      return "🟠";
    case "low":
      return "🔵";
    case "none":
    default:
      return "⚪";
  }
}

/**
 * Safely coerce arbitrary string input to a TaskPriority value
 */
export function normalizePriority(value: string | null | undefined): TaskPriority {
  if (!value) return "none";
  const normalized = value.trim().toLowerCase();
  if (normalized === "high" || normalized === "medium" || normalized === "low" || normalized === "none") {
    return normalized as TaskPriority;
  }
  return "none";
}
