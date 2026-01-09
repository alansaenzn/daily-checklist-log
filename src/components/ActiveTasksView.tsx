/**
 * ActiveTasksView Component
 * 
 * Task management interface showing user's active task templates.
 * Allows creating, editing, and organizing task templates by category.
 * Features: collapsible categories and drag-to-reorder functionality.
 */

"use client";

import { useState, useEffect } from "react";
import TaskRow from "@/app/tasks/TaskRow";
import TaskForm from "@/app/tasks/TaskForm";
import { CollapsibleCategorySection } from "@/components/CollapsibleCategorySection";
import { type TaskType } from "@/lib/task-types";
import { normalizePriority, PriorityConfig } from "@/lib/priority-utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface TaskTemplate {
  id: string | number;
  title: string | null;
  category: string | null;
  is_active: boolean | null;
  status?: string | null;
  deactivated_at?: string | null;
  task_type: string | null;
  archived_at: string | null;
  created_at: string | null;
  notes: string | null;
  url: string | null;
  due_date: string | null;
  due_time: string | null;
  list_name: string | null;
  details: string | null;
  project_id: string | null;
  priority: string | null;
  recurrence_interval_days?: number | null;
  recurrence_days_mask?: number | null;
}

interface ActiveTasksViewProps {
  templates: TaskTemplate[];
  existingCategories: string[];
}

const CATEGORY_ORDER_STORAGE_KEY = "task-categories-order";
const CATEGORY_COLLAPSED_STORAGE_KEY = "task-categories-collapsed";

type SortMode =
  | "title"
  | "priority"
  | "created_desc"
  | "created_asc"
  | "due_asc"
  | "due_desc";

export function ActiveTasksView({
  templates,
  existingCategories,
}: ActiveTasksViewProps) {
  type ViewMode = "sections" | "list" | "cards";
  // Local state for collapsed categories and category order
  // Initialize with stable SSR-safe defaults; hydrate from localStorage in effects
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [projectLookup, setProjectLookup] = useState<Record<string, string>>({});
  const [sortMode, setSortMode] = useState<SortMode>("title");
  const [hasLoadedSortMode, setHasLoadedSortMode] = useState(false);
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("sections");
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [taskOverrides, setTaskOverrides] = useState<Record<string, Partial<TaskTemplate>>>(
    {}
  );

  // Sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize sort mode from localStorage (client-only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("active-tasks-sort-mode");
      if (
        stored &&
        ["title", "priority", "created_desc", "created_asc", "due_asc", "due_desc"].includes(stored)
      ) {
        setSortMode(stored as SortMode);
      }
    } catch {}
    setHasLoadedSortMode(true);
  }, []);

  // Mark as mounted to safely render client-only subtrees
  useEffect(() => {
    setMounted(true);
  }, []);

  // Save sort mode to localStorage when it changes (after initial load)
  useEffect(() => {
    if (!hasLoadedSortMode) return;
    try {
      localStorage.setItem("active-tasks-sort-mode", sortMode);
    } catch {}
  }, [hasLoadedSortMode, sortMode]);

  // Initialize category order and collapsed categories from localStorage (client-only)
  useEffect(() => {
    const storedOrder = localStorage.getItem(CATEGORY_ORDER_STORAGE_KEY);
    if (storedOrder && categoryOrder.length === 0) {
      try {
        setCategoryOrder(JSON.parse(storedOrder));
      } catch (e) {
        console.error("Failed to parse category order from storage", e);
      }
    }

    // Initialize collapsed categories from localStorage only if empty
    const storedCollapsed = localStorage.getItem(CATEGORY_COLLAPSED_STORAGE_KEY);
    if (storedCollapsed && collapsedCategories.size === 0) {
      try {
        const collapsedArray = JSON.parse(storedCollapsed);
        setCollapsedCategories(new Set(collapsedArray));
      } catch (e) {
        console.error("Failed to parse collapsed categories from storage", e);
      }
    }

    // Initialize view mode from localStorage
    try {
      const storedView = localStorage.getItem("tasks-view-mode");
      if (storedView === "sections" || storedView === "list" || storedView === "cards") {
        setViewMode(storedView);
      }
    } catch (e) {
      // no-op
    }
  }, []);

  // Persist collapsed categories to localStorage
  useEffect(() => {
    const collapsedArray = Array.from(collapsedCategories);
    localStorage.setItem(CATEGORY_COLLAPSED_STORAGE_KEY, JSON.stringify(collapsedArray));
  }, [collapsedCategories]);

  // Load project names once for inline previews
  useEffect(() => {
    async function loadProjects() {
      try {
        const response = await fetch("/api/projects");
        if (!response.ok) return;
        const projects = await response.json();
        const lookup = (projects || []).reduce(
          (acc: Record<string, string>, project: { id: string; name: string }) => {
            acc[project.id] = project.name;
            return acc;
          },
          {}
        );
        setProjectLookup(lookup);
      } catch (err) {
        console.error("Failed to load projects for active tasks", err);
      }
    }
    loadProjects();
  }, []);

  // Handle toggle collapse
  const handleToggleCollapse = (categoryId: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Handle drag end - reorder categories
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = categoryOrder.indexOf(active.id);
      const newIndex = categoryOrder.indexOf(over.id);

      const newOrder = arrayMove(categoryOrder, oldIndex, newIndex);
      setCategoryOrder(newOrder);

      // Persist to localStorage
      localStorage.setItem(CATEGORY_ORDER_STORAGE_KEY, JSON.stringify(newOrder));
    }
  };

  const getPriorityRank = (priority: string | null | undefined) => {
    const normalized = normalizePriority(priority ?? undefined);
    switch (normalized) {
      case "high":
        return 3;
      case "medium":
        return 2;
      case "low":
        return 1;
      default:
        return 0;
    }
  };

  const getCreatedTimestamp = (value: string | null | undefined) => {
    if (!value) return null;
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const getDueTimestamp = (task: TaskTemplate) => {
    if (!task.due_date) return null;
    const time = task.due_time?.trim();
    const iso = time ? `${task.due_date}T${time}` : `${task.due_date}T00:00:00`;
    const parsed = Date.parse(iso);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const compareByTitle = (a: TaskTemplate, b: TaskTemplate) =>
    (a.title || "").localeCompare(b.title || "", undefined, {
      sensitivity: "base",
    });

  const compareTasks = (a: TaskTemplate, b: TaskTemplate) => {
    if (sortMode === "priority") {
      const rankDiff = getPriorityRank(b.priority) - getPriorityRank(a.priority);
      return rankDiff !== 0 ? rankDiff : compareByTitle(a, b);
    }

    if (sortMode === "created_desc" || sortMode === "created_asc") {
      const aTime = getCreatedTimestamp(a.created_at);
      const bTime = getCreatedTimestamp(b.created_at);
      if (aTime === null && bTime === null) return compareByTitle(a, b);
      if (aTime === null) return 1;
      if (bTime === null) return -1;
      return sortMode === "created_desc" ? bTime - aTime : aTime - bTime;
    }

    if (sortMode === "due_asc" || sortMode === "due_desc") {
      const aTime = getDueTimestamp(a);
      const bTime = getDueTimestamp(b);
      if (aTime === null && bTime === null) return compareByTitle(a, b);
      if (aTime === null) return 1;
      if (bTime === null) return -1;
      return sortMode === "due_desc" ? bTime - aTime : aTime - bTime;
    }

    return compareByTitle(a, b);
  };

  // Normalize active/deactivated across possible schemas.
  const isActiveTask = (task: TaskTemplate) => {
    if (typeof task.is_active === "boolean") return task.is_active;
    if (typeof task.status === "string") return task.status === "active";
    if (typeof task.deactivated_at !== "undefined") return task.deactivated_at === null;
    return true;
  };
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wide">
          Management
        </p>
        <h2 className="text-3xl font-black uppercase tracking-tight">
           Tasks
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Create and manage your tasks
        </p>
      </header>

      <TaskForm existingCategories={existingCategories} />

      <div className="flex flex-wrap items-center gap-3">
        <label
          htmlFor="task-sort-mode"
          className="text-xs uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wide"
        >
          Sort tasks
        </label>
        <select
          id="task-sort-mode"
          value={sortMode}
          onChange={(event) => setSortMode(event.target.value as SortMode)}
          className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="title">Title (A-Z)</option>
          <option value="priority">Priority (High → Low)</option>
          <option value="created_desc">Date created (Newest)</option>
          <option value="created_asc">Date created (Oldest)</option>
          <option value="due_asc">Due date (Soonest)</option>
          <option value="due_desc">Due date (Latest)</option>
        </select>

        <label
          htmlFor="task-show-deactivated"
          className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-200"
        >
          <span className="uppercase tracking-wide">Show deactivated</span>
          <span
            className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-colors ${
              showDeactivated
                ? "border-blue-600 bg-blue-600 dark:border-blue-500 dark:bg-blue-500"
                : "border-gray-400 bg-gray-200 dark:border-gray-600 dark:bg-gray-700"
            }`}
          >
            <input
              id="task-show-deactivated"
              type="checkbox"
              checked={showDeactivated}
              onChange={(event) => setShowDeactivated(event.target.checked)}
              className="absolute h-0 w-0 opacity-0"
            />
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white dark:bg-gray-100 shadow-sm ring-1 ring-gray-300 dark:ring-gray-500 transition-transform ${
                showDeactivated ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </span>
        </label>

        {/* View Mode Toggle */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wide">View</span>
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
            {(
              [
                { key: "sections", label: "Sections" },
                { key: "list", label: "List" },
                { key: "cards", label: "Cards" },
              ] as { key: ViewMode; label: string }[]
            ).map((opt, idx) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => {
                  setViewMode(opt.key);
                  try { localStorage.setItem("tasks-view-mode", opt.key); } catch {}
                }}
                className={`${
                  viewMode === opt.key
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                } px-3 py-1.5 text-xs font-semibold ${idx !== 0 ? "border-l border-gray-300 dark:border-gray-700" : ""}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="space-y-4">
        {/* Group tasks by category */}
        {(() => {
          // Deduplicate by title (case-insensitive)
          const seenTitles = new Set<string>();
          const deduped = (templates ?? []).filter((t) => {
            const titleLower = (t.title ?? "").trim().toLowerCase();
            if (seenTitles.has(titleLower)) return false;
            seenTitles.add(titleLower);
            return true;
          });

          // Apply active/deactivated filter without refetching.
          const filtered = deduped.filter((task) => {
            const active = isActiveTask(task);
            return showDeactivated ? !active : active;
          });

          if (filtered.length === 0) {
            return (
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 p-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {showDeactivated ? "No deactivated tasks" : "No active tasks"}
                </p>
              </div>
            );
          }

          // If list/cards view, render flat collection
          if (viewMode === "list" || viewMode === "cards") {
                    const withOverrides = (t: TaskTemplate): TaskTemplate => ({
                      ...t,
                      ...(taskOverrides[(t.id as string)] || {}),
                    });
                    const flat = filtered.map(withOverrides).sort(compareTasks);
            if (viewMode === "list") {
              return (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40">
                  {flat.map((t, idx) => (
                    <div key={t.id as string} className={idx === 0 ? "" : "border-t border-gray-100 dark:border-gray-800"}>
                      {quickEditId === (t.id as string) ? (
                        <div className="p-3">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => setQuickEditId(null)}
                              className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              Close
                            </button>
                          </div>
                          <TaskRow
                            startEditing
                            key={(t.id as string) + "-edit"}
                            task={{
                              id: t.id as string,
                              title: t.title as string,
                              category: (t.category as string) ?? "Uncategorized",
                              is_active: t.is_active ?? false,
                              task_type: (t.task_type as TaskType) || "recurring",
                              archived_at: t.archived_at,
                              notes: t.notes,
                              url: t.url,
                              due_date: t.due_date,
                              due_time: t.due_time,
                              list_name: t.list_name,
                              details: t.details,
                              project_id: t.project_id,
                              priority: t.priority ?? null,
                              recurrence_interval_days: (t as any).recurrence_interval_days ?? null,
                              recurrence_days_mask: (t as any).recurrence_days_mask ?? null,
                            }}
                            availableCategories={existingCategories}
                            onCollapse={() => setQuickEditId(null)}
                            projectLookup={projectLookup}
                            onUpdated={(updated) => {
                              setTaskOverrides((prev) => ({
                                ...prev,
                                [updated.id]: {
                                  ...prev[updated.id],
                                  ...updated,
                                },
                              }));
                            }}
                          />
                        </div>
                      ) : (
                        <SimpleTaskListItem
                          task={{
                            ...t,
                            ...(taskOverrides[(t.id as string)] || {}),
                          }}
                          projectLookup={projectLookup}
                          onOpen={() => setQuickEditId(t.id as string)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              );
            }
            // cards view
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {flat.map((t) => (
                  <TaskRow
                    key={t.id as string}
                    task={{
                      id: t.id as string,
                      title: t.title as string,
                      category: (t.category as string) ?? "Uncategorized",
                      is_active: t.is_active ?? false,
                      task_type: (t.task_type as TaskType) || "recurring",
                      archived_at: t.archived_at,
                      notes: t.notes,
                      url: t.url,
                      due_date: t.due_date,
                      due_time: t.due_time,
                      list_name: t.list_name,
                      details: t.details,
                      project_id: t.project_id,
                      priority: t.priority ?? null,
                      recurrence_interval_days: (t as any).recurrence_interval_days ?? null,
                      recurrence_days_mask: (t as any).recurrence_days_mask ?? null,
                    }}
                    availableCategories={existingCategories}
                    isExpanded={expandedTaskId === (t.id as string)}
                    onToggleExpand={(taskId) =>
                      setExpandedTaskId((prev) => (prev === taskId ? null : taskId))
                    }
                    onCollapse={() => setExpandedTaskId(null)}
                    projectLookup={projectLookup}
                    onUpdated={(updated) => {
                      setTaskOverrides((prev) => ({
                        ...prev,
                        [updated.id]: {
                          ...prev[updated.id],
                          ...updated,
                        },
                      }));
                    }}
                  />
                ))}
              </div>
            );
          }

          // Sections view: group by category with drag/collapse
          // Normalize categories (capitalize)
          function normalizeCategory(cat: string | null | undefined) {
            if (!cat || cat.trim() === "") return "Uncategorized";
            return cat.trim().replace(/\b\w/g, (c) => c.toUpperCase());
          }
          const grouped: Record<string, typeof filtered> = {};
          filtered.forEach((t) => {
            const cat = normalizeCategory(t.category);
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(t);
          });

          // Get all categories and apply custom order
          let cats = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

          if (categoryOrder.length > 0) {
            cats = cats.sort((a, b) => {
              const aIndex = categoryOrder.indexOf(a);
              const bIndex = categoryOrder.indexOf(b);
              if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
              if (aIndex !== -1) return -1;
              if (bIndex !== -1) return 1;
              return a.localeCompare(b);
            });

            const unorderedCats = cats.filter((c) => !categoryOrder.includes(c));
            cats = [...cats.filter((c) => categoryOrder.includes(c)), ...unorderedCats];
          }

          // Avoid SSR/client ID mismatches from DnD by rendering only after mount
          if (!mounted) {
            return null;
          }

          return (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={cats} strategy={verticalListSortingStrategy}>
                {cats.map((cat) => (
                  <CollapsibleCategorySection
                    key={cat}
                    categoryId={cat}
                    categoryName={cat}
                    isCollapsed={collapsedCategories.has(cat)}
                    onToggleCollapse={handleToggleCollapse}
                  >
                    <div className="space-y-3">
                      {grouped[cat]
                        .slice()
                        .map((t) => ({
                          ...t,
                          ...(taskOverrides[(t.id as string)] || {}),
                        }))
                        .sort(compareTasks)
                        .map((t) => (
                          <TaskRow
                            key={t.id as string}
                            task={{
                              id: t.id as string,
                              title: t.title as string,
                              category: t.category as string,
                              is_active: t.is_active ?? false,
                              task_type: (t.task_type as TaskType) || "recurring",
                              archived_at: t.archived_at,
                              notes: t.notes,
                              url: t.url,
                              due_date: t.due_date,
                              due_time: t.due_time,
                              list_name: t.list_name,
                              details: t.details,
                              project_id: t.project_id,
                              priority: t.priority ?? null,
                              recurrence_interval_days: (t as any).recurrence_interval_days ?? null,
                              recurrence_days_mask: (t as any).recurrence_days_mask ?? null,
                            }}
                            availableCategories={existingCategories}
                            isExpanded={expandedTaskId === (t.id as string)}
                            onToggleExpand={(taskId) =>
                              setExpandedTaskId((prev) => (prev === taskId ? null : taskId))
                            }
                            onCollapse={() => setExpandedTaskId(null)}
                            projectLookup={projectLookup}
                            onUpdated={(updated) => {
                              setTaskOverrides((prev) => ({
                                ...prev,
                                [updated.id]: {
                                  ...prev[updated.id],
                                  ...updated,
                                },
                              }));
                            }}
                          />
                        ))}
                    </div>
                  </CollapsibleCategorySection>
                ))}
              </SortableContext>
            </DndContext>
          );
        })()}
      </section>
    </div>
  );
}

// Lightweight list item for simplified "List" view
function SimpleTaskListItem({
  task,
  projectLookup,
  onOpen,
}: {
  task: TaskTemplate;
  projectLookup: Record<string, string>;
  onOpen: () => void;
}) {
  const title = task.title || "Untitled";
  const category = (task.category || "Uncategorized").trim();
  const isRecurring = (task.task_type as TaskType) === "recurring";
  const dueDateLabel = (() => {
    if (!task.due_date) return null;
    const parsed = new Date(task.due_date);
    if (Number.isNaN(parsed.getTime())) return task.due_date;
    return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  })();
  const dueTimeLabel = task.due_time?.trim() || null;
  const schedule = [dueDateLabel, dueTimeLabel].filter(Boolean).join(" ");
  const projectLabel = (() => {
    const id = task.project_id || "";
    if (id === "") return null;
    return projectLookup[id] || null;
  })();
  const priorityLevel = normalizePriority(task.priority ?? undefined);
  const priorityBadge = (() => {
    if (priorityLevel === "none") return null;
    const cfg = PriorityConfig[priorityLevel];
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.textColor}`}>
        <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${cfg.dotColor}`} />
        <span>{cfg.label}</span>
      </span>
    );
  })();

  return (
    <div
      className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40 px-4"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">{title}</div>
          {isRecurring && (
            <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <span aria-hidden>↻</span> Daily
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 flex-wrap">
          {schedule && (
            <span className="text-red-600 dark:text-red-400 font-medium">{schedule}</span>
          )}
          <span className="text-gray-500">•</span>
          <span className="font-medium text-gray-800 dark:text-gray-200">{category}</span>
          {projectLabel && <span className="text-gray-500">•</span>}
          {projectLabel && (
            <span className="text-gray-700 dark:text-gray-300">{projectLabel}</span>
          )}
          {priorityBadge && (
            <>
              <span className="text-gray-500">•</span>
              {priorityBadge}
            </>
          )}
        </div>
      </div>
      <div className="pl-2 text-sm text-blue-600 dark:text-blue-400 font-semibold">Edit</div>
    </div>
  );
}
