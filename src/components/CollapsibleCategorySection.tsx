/**
 * CollapsibleCategorySection Component
 * 
 * Renders a category section with:
 * - Collapsible header (toggle expand/collapse)
 * - Drag handle for reordering
 * - Child tasks rendered inside
 */

"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface CollapsibleCategorySectionProps {
  categoryId: string; // Unique ID for the category
  categoryName: string;
  isCollapsed: boolean;
  onToggleCollapse: (categoryId: string) => void;
  children: React.ReactNode;
}

export function CollapsibleCategorySection({
  categoryId,
  categoryName,
  isCollapsed,
  onToggleCollapse,
  children,
}: CollapsibleCategorySectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: categoryId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border border-gray-200 dark:border-gray-700 transition-all ${
        isDragging ? "bg-blue-50 dark:bg-blue-900/20" : "bg-white dark:bg-gray-900/50"
      }`}
    >
      {/* Category Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          title="Drag to reorder"
        >
          <svg
            className="w-5 h-5 text-gray-400 dark:text-gray-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M8 5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm3 1.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM8 10a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm3 1.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM8 15a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm3 1.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
          </svg>
        </div>

        {/* Toggle Button & Category Name */}
        <button
          onClick={() => onToggleCollapse(categoryId)}
          className="flex-1 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 px-2 py-1 rounded transition-colors text-left"
        >
          <svg
            className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${
              isCollapsed ? "-rotate-90" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {categoryName}
          </h3>
        </button>
      </div>

      {/* Category Content (Collapsible) */}
      {!isCollapsed && (
        <div className="px-4 py-3 space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}
