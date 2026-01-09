/**
 * TasksView Component
 * 
 * Main Tasks page with internal tabs:
 * - Tasks: Execution surface (checkboxes, daily tasks)
 * - Categories: Manage category labels without leaving Tasks
 * - Templates: Browse and manage task templates
 */

"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GoalTemplate } from "@/lib/task-types";
import { TemplatesView } from "@/components/TemplatesView";
import { ActiveTasksView } from "@/components/ActiveTasksView";
import { renameCategory, deleteCategory } from "@/app/actions/tasks";

type TaskTemplate = {
  id: string | number;
  title: string | null;
  category: string | null;
  is_active: boolean | null;
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
};

type CategoryWithCount = {
  name: string;
  count: number;
};

interface TasksViewProps {
  taskTemplates: TaskTemplate[];
  categories: CategoryWithCount[];
  templates: GoalTemplate[];
}

type TasksTab = "tasks" | "categories" | "templates";

const CATEGORY_ORDER_STORAGE_KEY = "task-categories-order";
const CUSTOM_CATEGORIES_STORAGE_KEY = "task-categories-custom";

const normalizeCategoryName = (name: string | null | undefined) =>
  name?.trim() ? name.trim() : "General";

function buildCategoryList(
  templates: TaskTemplate[],
  customCategories: string[],
  categoryOrder: string[]
): CategoryWithCount[] {
  const map = new Map<string, CategoryWithCount>();
  const lowerToName = new Map<string, string>();

  templates.forEach((t) => {
    const name = normalizeCategoryName(t.category);
    const key = name.toLowerCase();
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, { name, count: 1 });
      lowerToName.set(key, name);
    }
  });

  customCategories.forEach((category) => {
    const name = category.trim();
    if (!name) return;
    const key = name.toLowerCase();
    if (!map.has(key)) {
      map.set(key, { name, count: 0 });
      lowerToName.set(key, name);
    }
  });

  if (!map.has("general")) {
    map.set("general", { name: "General", count: 0 });
  }

  let list = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));

  if (categoryOrder.length > 0) {
    const mapByLower = new Map(list.map((c) => [c.name.toLowerCase(), c]));
    const ordered: CategoryWithCount[] = [];
    categoryOrder.forEach((name) => {
      const entry = mapByLower.get(name.toLowerCase());
      if (entry && !ordered.includes(entry)) {
        ordered.push(entry);
      }
    });
    const remaining = list.filter((c) => !ordered.includes(c));
    list = [...ordered, ...remaining];
  }

  return list;
}

export function TasksView({
  taskTemplates,
  categories,
  templates,
}: TasksViewProps) {
  const [activeTab, setActiveTab] = useState<TasksTab>("tasks");
  const [taskTemplatesState, setTaskTemplatesState] = useState<TaskTemplate[]>(taskTemplates);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [busyCategory, setBusyCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Keep tasks in sync if server data changes
  useEffect(() => {
    setTaskTemplatesState(taskTemplates);
  }, [taskTemplates]);

  useEffect(() => {
    const storedCustom = localStorage.getItem(CUSTOM_CATEGORIES_STORAGE_KEY);
    if (storedCustom) {
      try {
        const parsed = JSON.parse(storedCustom);
        if (Array.isArray(parsed)) {
          setCustomCategories(parsed);
        }
      } catch (err) {
        console.warn("Failed to parse custom categories", err);
      }
    }

    const storedOrder = localStorage.getItem(CATEGORY_ORDER_STORAGE_KEY);
    if (storedOrder) {
      try {
        const parsed = JSON.parse(storedOrder);
        if (Array.isArray(parsed)) {
          setCategoryOrder(parsed);
        }
      } catch (err) {
        console.warn("Failed to parse category order", err);
      }
    }
    setHasLoadedStorage(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedStorage) return;
    if (categoryOrder.length === 0 && categories.length > 0) {
      setCategoryOrder(categories.map((c) => c.name));
    }
  }, [categories, categoryOrder.length, hasLoadedStorage]);

  // Persist custom categories only after storage has loaded to avoid overwriting
  // previously saved values during initial mount or hydration.
  useEffect(() => {
    if (!hasLoadedStorage) return;
    localStorage.setItem(
      CUSTOM_CATEGORIES_STORAGE_KEY,
      JSON.stringify(customCategories)
    );
  }, [customCategories, hasLoadedStorage]);

  useEffect(() => {
    localStorage.setItem(CATEGORY_ORDER_STORAGE_KEY, JSON.stringify(categoryOrder));
  }, [categoryOrder]);

  const categoriesState = useMemo(
    () => buildCategoryList(taskTemplatesState, customCategories, categoryOrder),
    [taskTemplatesState, customCategories, categoryOrder]
  );

  const sortedCategoryNames = categoriesState.map((c) => c.name);

  const handleRenameCategory = async (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setError("Category name is required");
      return;
    }

    // Client-side duplicate guard to prevent unnecessary requests
    const duplicate = categoriesState.some(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase() && c.name !== oldName
    );
    if (duplicate) {
      setError("Category name already exists");
      return;
    }

    setBusyCategory(oldName);
    setError(null);
    try {
      await renameCategory(oldName, trimmed);
      // Update templates so task list reflects the rename instantly
      setTaskTemplatesState((prev) =>
        prev.map((t) => ({
          ...t,
          category: (t.category?.trim() || "General") === oldName ? trimmed : t.category,
        }))
      );
      setCustomCategories((prev) =>
        prev.map((category) => (category === oldName ? trimmed : category))
      );
      setCategoryOrder((prev) =>
        prev.map((category) => (category === oldName ? trimmed : category))
      );
    } catch (e: any) {
      setError(e.message || "Failed to rename category");
    } finally {
      setBusyCategory(null);
    }
  };

  const handleDeleteCategory = async (name: string) => {
    if (name === "General") {
      setError("Default category cannot be deleted");
      return;
    }

    const categoryEntry = categoriesState.find((c) => c.name === name);
    const isLocalOnly =
      (categoryEntry?.count ?? 0) === 0 && customCategories.includes(name);

    setBusyCategory(name);
    setError(null);
    try {
      if (!isLocalOnly) {
        await deleteCategory(name);
        // Reassign tasks locally to General to mirror server behavior
        setTaskTemplatesState((prev) =>
          prev.map((t) => ({
            ...t,
            category: (t.category?.trim() || "General") === name ? "General" : t.category,
          }))
        );
      }

      setCustomCategories((prev) => prev.filter((category) => category !== name));
      setCategoryOrder((prev) => prev.filter((category) => category !== name));
    } catch (e: any) {
      setError(e.message || "Failed to delete category");
    } finally {
      setBusyCategory(null);
    }
  };

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      setError("Category name is required");
      return;
    }

    const duplicate = categoriesState.some(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      setError("Category name already exists");
      return;
    }

    // Update state and immediately persist so a quick refresh doesn't lose it
    setCustomCategories((prev) => {
      const next = [...prev, trimmed];
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(
            CUSTOM_CATEGORIES_STORAGE_KEY,
            JSON.stringify(next)
          );
        }
      } catch {}
      return next;
    });
    setCategoryOrder((prev) => {
      if (prev.length === 0) {
        return [...categoriesState.map((c) => c.name), trimmed];
      }
      if (prev.includes(trimmed)) return prev;
      return [...prev, trimmed];
    });
    setNewCategoryName("");
    setError(null);
  };

  const handleSortAlphabetical = () => {
    setCategoryOrder([]);
  };

  const handleReorderCategories = (orderedNames: string[]) => {
    const unique = Array.from(new Set(orderedNames));
    setCategoryOrder(["General", ...unique.filter((name) => name !== "General")]);
  };

  return (
    <>
      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex gap-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("tasks")}
            className={`pb-3 text-sm font-bold uppercase tracking-wide transition-colors relative ${
              activeTab === "tasks"
                ? "text-blue-600 dark:text-blue-500"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Tasks
            {activeTab === "tasks" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`pb-3 text-sm font-bold uppercase tracking-wide transition-colors relative ${
              activeTab === "categories"
                ? "text-blue-600 dark:text-blue-500"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Categories
            {activeTab === "categories" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`pb-3 text-sm font-bold uppercase tracking-wide transition-colors relative ${
              activeTab === "templates"
                ? "text-blue-600 dark:text-blue-500"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Templates
            {activeTab === "templates" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-500" />
            )}
          </button>
        </div>
      </div>

      {/* Tab Content (kept mounted to preserve state) */}
      <div className={activeTab === "tasks" ? "" : "hidden"}>
        <ActiveTasksView
          templates={taskTemplatesState}
          existingCategories={sortedCategoryNames}
        />
      </div>

      <div className={activeTab === "categories" ? "" : "hidden"}>
        <CategoriesTab
          categories={categoriesState}
          tasks={taskTemplatesState}
          error={error}
          busyCategory={busyCategory}
          isManagingCategories={isManagingCategories}
          newCategoryName={newCategoryName}
          onToggleManage={() => setIsManagingCategories((prev) => !prev)}
          onAddCategory={handleAddCategory}
          onNewCategoryNameChange={setNewCategoryName}
          onSortAlphabetical={handleSortAlphabetical}
          onRenameCategory={handleRenameCategory}
          onDeleteCategory={handleDeleteCategory}
          onReorderCategories={handleReorderCategories}
        />
      </div>

      <div className={activeTab === "templates" ? "" : "hidden"}>
        <TemplatesView templates={templates} />
      </div>
    </>
  );
}

interface CategoryRowProps {
  category: CategoryWithCount;
  isDefault: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  tasks: { id: string | number; title: string; task_type: string }[];
}

interface CategoryEditRowProps {
  category: CategoryWithCount;
  isDefault: boolean;
  isBusy: boolean;
  onRename: (newName: string) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
  dragHandle?: ReactNode;
}

function CategoriesTab({
  categories,
  tasks,
  error,
  busyCategory,
  isManagingCategories,
  newCategoryName,
  onToggleManage,
  onAddCategory,
  onNewCategoryNameChange,
  onSortAlphabetical,
  onRenameCategory,
  onDeleteCategory,
  onReorderCategories,
}: {
  categories: CategoryWithCount[];
  tasks: TaskTemplate[];
  error: string | null;
  busyCategory: string | null;
  isManagingCategories: boolean;
  newCategoryName: string;
  onToggleManage: () => void;
  onAddCategory: () => void;
  onNewCategoryNameChange: (value: string) => void;
  onSortAlphabetical: () => void;
  onRenameCategory: (oldName: string, newName: string) => Promise<void> | void;
  onDeleteCategory: (name: string) => Promise<void> | void;
  onReorderCategories: (orderedNames: string[]) => void;
}) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const defaultCategory = categories.find((category) => category.name === "General") || null;
  const draggableCategories = categories.filter((category) => category.name !== "General");
  const tasksByCategory = useMemo(() => {
    const grouped = new Map<string, TaskTemplate[]>();
    tasks.forEach((task) => {
      const name = normalizeCategoryName(task.category);
      if (!grouped.has(name)) grouped.set(name, []);
      grouped.get(name)!.push(task);
    });
    grouped.forEach((list) => {
      list.sort((a, b) =>
        (a.title || "").localeCompare(b.title || "", undefined, { sensitivity: "base" })
      );
    });
    return grouped;
  }, [tasks]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = draggableCategories.map((category) => category.name);
    const oldIndex = ids.indexOf(active.id);
    const newIndex = ids.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(ids, oldIndex, newIndex);
    onReorderCategories(reordered);
  };

  const toggleCategory = (name: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Categories</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isManagingCategories ? "Manage names, ordering, and cleanup." : "View categories and task counts."}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleManage}
          className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {isManagingCategories ? "Done" : "Manage Categories"}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {isManagingCategories && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={newCategoryName}
              onChange={(e) => onNewCategoryNameChange(e.target.value)}
              maxLength={60}
              placeholder="Add a category..."
              className="flex-1 min-w-[180px] rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={onAddCategory}
              className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold uppercase tracking-wide hover:bg-blue-700"
            >
              Add
            </button>
            <button
              type="button"
              onClick={onSortAlphabetical}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Sort A-Z
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Categories apply when you create tasks. Empty categories live locally until used.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {!isManagingCategories && (
          <>
            {categories.map((category) => (
              <CategoryRow
                key={category.name}
                category={category}
                isDefault={category.name === "General"}
                isExpanded={expandedCategories.has(category.name)}
                onToggle={() => toggleCategory(category.name)}
                tasks={(tasksByCategory.get(category.name) || []).map((task) => ({
                  id: task.id,
                  title: task.title || "",
                  task_type: task.task_type || "recurring",
                }))}
              />
            ))}
          </>
        )}

        {isManagingCategories && defaultCategory && (
          <CategoryEditRow
            key={defaultCategory.name}
            category={defaultCategory}
            isDefault
            isBusy={busyCategory === defaultCategory.name}
            onRename={(next) => onRenameCategory(defaultCategory.name, next)}
            onDelete={() => onDeleteCategory(defaultCategory.name)}
          />
        )}

        {isManagingCategories && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={draggableCategories.map((category) => category.name)} strategy={verticalListSortingStrategy}>
              {draggableCategories.map((category) => (
                <SortableCategoryEditRow
                  key={category.name}
                  category={category}
                  isDefault={false}
                  isBusy={busyCategory === category.name}
                  onRename={(next) => onRenameCategory(category.name, next)}
                  onDelete={() => onDeleteCategory(category.name)}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
        {categories.length === 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400">No categories yet.</p>
        )}
      </div>
    </div>
  );
}

function CategoryRow({
  category,
  isDefault,
  isExpanded,
  onToggle,
  tasks,
}: CategoryRowProps) {
  const label = isDefault ? "Default" : category.name;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 text-left"
        aria-expanded={isExpanded}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{label}</p>
            {isDefault && (
              <span className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-full px-2 py-0.5">
                System
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{category.count} tasks</p>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {isExpanded ? "▼" : "▶"}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-3 border-t border-gray-100 dark:border-gray-800 pt-3 space-y-2">
          {tasks.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">No tasks yet.</p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="rounded-md border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm text-gray-800 dark:text-gray-200"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{task.title}</span>
                  <span className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {task.task_type === "one_off" ? "One-off" : "Recurring"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function CategoryEditRow({
  category,
  isDefault,
  isBusy,
  onRename,
  onDelete,
  dragHandle,
}: CategoryEditRowProps) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(category.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const trimmed = draftName.trim();
  const canSave = trimmed.length > 0 && trimmed !== category.name;

  useEffect(() => {
    if (!editing) {
      setDraftName(category.name);
    }
  }, [category.name, editing]);

  // Default category is not editable, deletable, or reorderable.
  if (isDefault) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Default</p>
              <span className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-full px-2 py-0.5">
                System
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{category.count} tasks</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3">
      <div className="flex items-start gap-3 flex-wrap justify-between">
        <div className="flex-1 min-w-0 space-y-1">
          {editing ? (
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              maxLength={60}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label={`Edit category ${category.name}`}
              disabled={isBusy}
            />
          ) : (
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{category.name}</p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">{category.count} tasks</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {editing ? (
            <>
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={isBusy}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onRename(trimmed)}
                disabled={isBusy || !canSave}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </>
          ) : confirmDelete ? (
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <span className="text-xs text-red-600 dark:text-red-400">Delete this category?</span>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={isBusy}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onDelete}
                disabled={isBusy}
                className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200"
              >
                {isBusy ? "Deleting..." : "Confirm"}
              </button>
            </div>
          ) : (
            <>
              {dragHandle}
              <button
                type="button"
                onClick={() => setEditing(true)}
                disabled={isBusy}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={isBusy}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SortableCategoryEditRow({
  category,
  isDefault,
  isBusy,
  onRename,
  onDelete,
}: CategoryEditRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.name,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handle = (
    <button
      type="button"
      className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
      aria-label={`Reorder ${category.name}`}
      {...attributes}
      {...listeners}
    >
      ↕
    </button>
  );

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "opacity-70" : ""}>
      <CategoryEditRow
        category={category}
        isDefault={isDefault}
        isBusy={isBusy}
        onRename={onRename}
        onDelete={onDelete}
        dragHandle={handle}
      />
    </div>
  );
}
