"use client";

import { useEffect, useState, useTransition } from "react";
import { toggleTaskForToday } from "../actions/tasks";
import { type TaskType } from "@/lib/task-types";
import { TaskDetailsPreview } from "@/components/TaskDetailsPreview";

type Item = {
  id: string;
  title: string;
  category: string;
  task_type: TaskType;
  checked: boolean;
  completed_at: string | null;
  notes?: string | null;
  details?: string | null;
  due_date?: string | null;
  due_time?: string | null;
  list_name?: string | null;
  project_id?: string | null;
  priority?: string | null;
  created_at?: string | null;
};

type SortMode =
  | "title"
  | "priority"
  | "created_desc"
  | "created_asc"
  | "due_asc"
  | "due_desc";

type FilterState = {
  status: "all" | "incomplete" | "completed";
  type: "all" | "recurring" | "one_off";
  category: "all" | string;
};

export default function TodayChecklist({
  initialItems,
  projectLookup = {},
}: {
  initialItems: Item[];
  projectLookup?: Record<string, string>;
}) {
  const SORT_MODE_STORAGE_KEY = "active-checklist-sort-mode";
  const FILTER_STORAGE_KEY = "active-checklist-filter";

  const [items, setItems] = useState(initialItems);
  const [isPending, startTransition] = useTransition();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("title");
  const [hasLoadedSortMode, setHasLoadedSortMode] = useState(false);
  const [filter, setFilter] = useState<FilterState>({
    status: "all",
    type: "all",
    category: "all",
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const completedCount = items.filter((i) => i.checked).length;

  useEffect(() => {
    const isSortMode = (value: string): value is SortMode =>
      value === "title" ||
      value === "priority" ||
      value === "created_desc" ||
      value === "created_asc" ||
      value === "due_asc" ||
      value === "due_desc";

    try {
      const stored = localStorage.getItem(SORT_MODE_STORAGE_KEY);
      if (stored && isSortMode(stored)) {
        setSortMode(stored);
      }
    } catch {
      // ignore storage errors
    } finally {
      setHasLoadedSortMode(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedSortMode) return;
    try {
      localStorage.setItem(SORT_MODE_STORAGE_KEY, sortMode);
    } catch {
      // ignore storage errors
    }
  }, [sortMode, hasLoadedSortMode]);

  // Load filter from storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FILTER_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          (parsed.status === "all" || parsed.status === "incomplete" || parsed.status === "completed") &&
          (parsed.type === "all" || parsed.type === "recurring" || parsed.type === "one_off") &&
          typeof parsed.category === "string"
        ) {
          setFilter(parsed as FilterState);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filter));
    } catch {}
  }, [filter]);

  const getPriorityRank = (priority: string | null | undefined) => {
    switch ((priority || "none").toLowerCase()) {
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

  const getDueTimestamp = (task: Item) => {
    if (!task.due_date) return null;
    const time = task.due_time?.trim();
    const iso = time ? `${task.due_date}T${time}` : `${task.due_date}T00:00:00`;
    const parsed = Date.parse(iso);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const compareByTitle = (a: Item, b: Item) =>
    (a.title || "").localeCompare(b.title || "", undefined, {
      sensitivity: "base",
    });

  const compareItems = (a: Item, b: Item) => {
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

  const categories = Array.from(new Set(items.map((i) => i.category).filter(Boolean)));

  const passesFilter = (i: Item) => {
    if (filter.status === "completed" && !i.checked) return false;
    if (filter.status === "incomplete" && i.checked) return false;
    if (filter.type !== "all" && i.task_type !== filter.type) return false;
    if (filter.category !== "all" && i.category !== filter.category) return false;
    return true;
  };

  const filteredItems = items.filter(passesFilter);
  const sortedItems = filteredItems.slice().sort(compareItems);

  const totalCount = items.length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const progressLabel = `${completedCount} of ${totalCount} tasks completed`;

  const sortLabels: Record<SortMode, string> = {
    title: "Title (A–Z)",
    priority: "Priority (High → Low)",
    created_desc: "Date created (Newest)",
    created_asc: "Date created (Oldest)",
    due_asc: "Due date (Soonest)",
    due_desc: "Due date (Latest)",
  };

  const filterLabel = (() => {
    if (filter.category !== "all") return `Category: ${filter.category}`;
    if (filter.type === "one_off") return "One-off";
    if (filter.type === "recurring") return "Recurring";
    if (filter.status === "completed") return "Completed";
    if (filter.status === "incomplete") return "Incomplete";
    return "All Tasks";
  })();

  function onToggle(id: string) {
    const previousItems = items;
    const target = items.find((i) => i.id === id);
    if (!target) return;

    // Once completed, do not allow unchecking (one-way action)
    if (target.checked) return;

    const nextChecked = !target.checked;
    const next = items.map((i) =>
      i.id === id ? { ...i, checked: nextChecked } : i
    );

    setItems(next);

    startTransition(async () =>
      toggleTaskForToday(id, nextChecked).catch((error: Error) => {
        setItems(previousItems);
        alert(error.message ?? "Failed to save");
      })
    );
  }

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Today</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">{progressLabel}</p>
          </div>
        </div>

        <ProgressBar percent={progressPercent} />

        {items.length > 0 && (
          <SortFilterBar
            sortValue={sortMode}
            sortLabel={sortLabels[sortMode]}
            onChangeSort={(value) => setSortMode(value)}
            filterLabel={filterLabel}
            onOpenFilter={() => setIsFilterOpen(true)}
          />
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-8 text-center text-slate-600 dark:text-slate-300">
          No active tasks. Head to Tasks to add some.
        </div>
      ) : (
        <ul className="space-y-3">
          {sortedItems.map((i) => {
            const projectName =
              i.project_id === null || typeof i.project_id === "undefined"
                ? null
                : i.project_id === ""
                  ? "Inbox"
                  : projectLookup[i.project_id] || "Project";
            const hasDetails = Boolean(
              i.notes ||
                i.details ||
                i.due_date ||
                i.due_time ||
                i.project_id ||
                i.list_name
            );

            return (
              <TaskCard
                key={i.id}
                item={i}
                projectName={projectName}
                hasDetails={hasDetails}
                isExpanded={expandedId === i.id}
                onToggleDetails={() =>
                  setExpandedId((prev) => (prev === i.id ? null : i.id))
                }
                onToggle={() => onToggle(i.id)}
                isPending={isPending}
              />
            );
          })}
        </ul>
      )}

      {isFilterOpen && (
        <FilterPanel
          filter={filter}
          categories={categories}
          onChange={(next) => setFilter(next)}
          onClose={() => setIsFilterOpen(false)}
        />
      )}
    </section>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className="h-full bg-blue-500 dark:bg-blue-400 transition-all"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{percent}%</span>
    </div>
  );
}

function SortFilterBar({
  sortValue,
  sortLabel,
  onChangeSort,
  filterLabel,
  onOpenFilter,
}: {
  sortValue: SortMode;
  sortLabel: string;
  onChangeSort: (mode: SortMode) => void;
  filterLabel: string;
  onOpenFilter: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <button
          type="button"
          className="w-full h-12 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm px-4 text-left flex items-center gap-3"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-lg">
            ⇅
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-xs text-slate-500 dark:text-slate-400">Sort</span>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{sortLabel}</span>
          </div>
        </button>
        <select
          aria-label="Sort tasks"
          value={sortValue}
          onChange={(event) => onChangeSort(event.target.value as SortMode)}
          className="absolute inset-0 h-full w-full opacity-0"
        >
          <option value="title">Title (A–Z)</option>
          <option value="priority">Priority (High → Low)</option>
          <option value="created_desc">Date created (Newest)</option>
          <option value="created_asc">Date created (Oldest)</option>
          <option value="due_asc">Due date (Soonest)</option>
          <option value="due_desc">Due date (Latest)</option>
        </select>
      </div>

      <button
        type="button"
        className="h-12 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm px-4 flex items-center gap-3 min-w-[44px]"
        aria-label="Filter tasks"
        onClick={() => onOpenFilter()}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
          <svg
            aria-hidden
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-5 w-5"
          >
            <path d="M3 4h14l-5.5 6.5V16l-3 1v-6.5L3 4Z" />
          </svg>
        </span>
        <div className="flex flex-col leading-tight">
          <span className="text-xs text-slate-500 dark:text-slate-400">Filter</span>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{filterLabel}</span>
        </div>
      </button>
    </div>
  );
}

function FilterPanel({
  filter,
  categories,
  onChange,
  onClose,
}: {
  filter: FilterState;
  categories: string[];
  onChange: (next: FilterState) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Filter Tasks</h3>
          <button className="text-sm font-medium text-blue-600" onClick={onClose}>Done</button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</legend>
            <div className="flex gap-2">
              {[
                { key: "all", label: "All" },
                { key: "incomplete", label: "Incomplete" },
                { key: "completed", label: "Completed" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => onChange({ ...filter, status: opt.key as FilterState["status"] })}
                  className={`px-3 py-2 rounded-full text-sm border transition-colors ${
                    filter.status === opt.key
                      ? "bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500 ring-2 ring-blue-500/60 dark:ring-blue-400/60"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-700 dark:text-slate-300">Type</legend>
            <div className="flex gap-2">
              {[
                { key: "all", label: "All" },
                { key: "recurring", label: "Recurring" },
                { key: "one_off", label: "One-off" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => onChange({ ...filter, type: opt.key as FilterState["type"] })}
                  className={`px-3 py-2 rounded-full text-sm border transition-colors ${
                    filter.type === opt.key
                      ? "bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500 ring-2 ring-blue-500/60 dark:ring-blue-400/60"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</legend>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onChange({ ...filter, category: "all" })}
                className={`px-3 py-2 rounded-full text-sm border transition-colors ${
                  filter.category === "all"
                    ? "bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500 ring-2 ring-blue-500/60 dark:ring-blue-400/60"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onChange({ ...filter, category: cat })}
                  className={`px-3 py-2 rounded-full text-sm border transition-colors ${
                    filter.category === cat
                      ? "bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500 ring-2 ring-blue-500/60 dark:ring-blue-400/60"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      </div>
    </div>
  );
}

function TaskCard({
  item,
  projectName,
  hasDetails,
  isExpanded,
  onToggleDetails,
  onToggle,
  isPending,
}: {
  item: Item;
  projectName: string | null;
  hasDetails: boolean;
  isExpanded: boolean;
  onToggleDetails: () => void;
  onToggle: () => void;
  isPending: boolean;
}) {
  const typeLabel = item.task_type === "one_off" ? "One-off" : null;

  return (
    <li className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          aria-label={`Focus on ${item.title}`}
        >
          ▶
        </button>

        <button
          type="button"
          className={`btn-plain flex-1 text-left min-w-0 ${hasDetails ? "" : "cursor-default"}`}
          onClick={() => (hasDetails ? onToggleDetails() : undefined)}
          aria-expanded={hasDetails ? isExpanded : undefined}
          aria-controls={hasDetails ? `active-task-details-${item.id}` : undefined}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 transition-transform ${
                hasDetails ? "" : "opacity-60 cursor-default"
              } ${isExpanded ? "rotate-90" : ""}`}
              aria-hidden
            >
              <span aria-hidden>›</span>
            </span>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 whitespace-normal break-words">
              {item.title}
            </h3>
            {typeLabel && (
              <span className="inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-900/40 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-200">
                {typeLabel}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 flex-wrap">
            <span className="font-medium text-slate-800 dark:text-slate-100">{item.category}</span>
            {projectName && (
              <>
                <span className="text-slate-400 dark:text-slate-500">•</span>
                <span>{projectName}</span>
              </>
            )}
            {item.due_date && (
              <>
                <span className="text-slate-400 dark:text-slate-500">•</span>
                <span className="text-slate-500 dark:text-slate-400">{item.due_date}</span>
              </>
            )}
          </div>
        </button>

        <button
          type="button"
          onClick={onToggle}
          disabled={isPending || item.checked}
          aria-pressed={item.checked}
          className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-colors ${
            item.checked
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600"
          } ${item.checked ? "cursor-default" : ""}`}
        >
          {item.checked ? "✓" : ""}
        </button>
      </div>

      {hasDetails && (
        <TaskDetailsPreview
          id={`active-task-details-${item.id}`}
          isOpen={isExpanded}
          category={item.category}
          projectName={projectName}
          taskType={item.task_type}
          dueDate={item.due_date || null}
          dueTime={item.due_time || null}
          notes={item.notes || null}
          details={item.details || null}
          tags={item.list_name ? [item.list_name] : undefined}
        />
      )}
    </li>
  );
}
