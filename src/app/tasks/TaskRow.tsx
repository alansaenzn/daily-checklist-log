"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { setTaskActive, deleteTask, updateTaskTemplate } from "../actions/tasks";
import { TaskBehavior, type TaskType, TASK_CATEGORIES } from "@/lib/task-types";
import { PriorityConfig, normalizePriority } from "@/lib/priority-utils";
import ProjectSelector from "@/components/ProjectSelector";
import { TaskDetailsPreview } from "@/components/TaskDetailsPreview";

interface Task {
  id: string;
  title: string;
  category: string;
  is_active: boolean;
  task_type: TaskType;
  archived_at: string | null;
  difficulty?: number | null;
  notes?: string | null;
  url?: string | null;
  due_date?: string | null;
  due_time?: string | null;
  list_name?: string | null;
  details?: string | null;
  project_id?: string | null; // Project assignment
  priority?: string | null; // Optional UI-only priority label
  recurrence_interval_days?: number | null;
  recurrence_days_mask?: number | null;
}

interface TaskRowProps {
  task: Task;
  availableCategories?: string[];
  isExpanded?: boolean;
  onToggleExpand?: (taskId: string) => void;
  onCollapse?: () => void;
  projectLookup?: Record<string, string>;
  onUpdated?: (updated: Partial<Task> & { id: string }) => void;
  startEditing?: boolean;
}

export default function TaskRow({
  task,
  availableCategories = [],
  isExpanded,
  onToggleExpand,
  onCollapse,
  projectLookup,
  onUpdated,
  startEditing,
}: TaskRowProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(Boolean(startEditing));
  const [title, setTitle] = useState(task.title);
  const [category, setCategory] = useState(task.category || "Uncategorized");
  const [taskType, setTaskType] = useState<TaskType>(task.task_type);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [expandedLocal, setExpandedLocal] = useState(false);
  
  // Extended fields
  const [notes, setNotes] = useState(task.notes || "");
  const [url, setUrl] = useState(task.url || "");
  const [dueDate, setDueDate] = useState(task.due_date || "");
  const [dueTime, setDueTime] = useState(task.due_time || "");
  const [listName, setListName] = useState(task.list_name || "");
  const [details, setDetails] = useState(task.details || "");
  const [projectId, setProjectId] = useState(task.project_id || "");
  type PriorityLevel = "none" | "low" | "medium" | "high";
  const [priority, setPriority] = useState<PriorityLevel>(
    normalizePriority(task.priority ?? undefined)
  );
  const [difficulty, setDifficulty] = useState<number>(() => {
    const raw = typeof task.difficulty === "number" ? task.difficulty : 3;
    return raw >= 1 && raw <= 5 ? Math.floor(raw) : 3;
  });
  const [recurrenceIntervalDays, setRecurrenceIntervalDays] = useState<string>(
    task.recurrence_interval_days ? String(task.recurrence_interval_days) : "1"
  );
  const [repeatDays, setRepeatDays] = useState<Set<number>>(new Set());

  // Initialize weekly repeat days from server mask (fallback to local)
  const repeatStorageKey = `task-repeat-days:${task.id}`;
  React.useEffect(() => {
    if (typeof task.recurrence_days_mask === "number") {
      const days: number[] = [];
      for (let i = 0; i < 7; i++) {
        if ((task.recurrence_days_mask & (1 << i)) !== 0) days.push(i);
      }
      setRepeatDays(new Set(days));
      return;
    }
    try {
      const raw = localStorage.getItem(repeatStorageKey);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setRepeatDays(new Set(arr as number[]));
      }
    } catch {}
  }, [repeatStorageKey, task.recurrence_days_mask]);
  const toggleRepeatDay = (idx: number) => {
    setRepeatDays((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  // Sync local priority/difficulty state when the incoming task prop changes
  React.useEffect(() => {
    setPriority(normalizePriority(task.priority ?? undefined));
  }, [task.priority]);

  React.useEffect(() => {
    const raw = typeof task.difficulty === "number" ? task.difficulty : 3;
    setDifficulty(raw >= 1 && raw <= 5 ? Math.floor(raw) : 3);
  }, [task.difficulty]);

  // Merge predefined and available custom categories
  const allCategories = [
    ...TASK_CATEGORIES,
    ...availableCategories.filter((cat) => !TASK_CATEGORIES.includes(cat as any)),
  ];

  const priorityLevel = priority;
  const priorityConfig = PriorityConfig[priorityLevel];
  const priorityBadgeLabel = priorityConfig.label;
  const showPriorityInPreview = priorityLevel !== "none";

  const formattedDueDate = (() => {
    if (!dueDate) return null;
    const parsed = new Date(dueDate);
    if (Number.isNaN(parsed.getTime())) return dueDate;
    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  })();

  const scheduleParts: string[] = [];
  if (formattedDueDate) scheduleParts.push(formattedDueDate);
  if (dueTime) scheduleParts.push(dueTime);
  if (task.task_type === "recurring") scheduleParts.push("Repeats");

  const hasSchedule = scheduleParts.length > 0;

  const projectLabel = (() => {
    if (projectId === null || typeof projectId === "undefined") return null;
    if (projectId === "") return "Inbox";
    if (projectLookup && projectLookup[projectId]) return projectLookup[projectId];
    return "Project";
  })();

  const hasPreviewContent = Boolean(
    category ||
    task.category ||
    projectLabel ||
    showPriorityInPreview ||
    hasSchedule ||
    notes ||
    details
  );

  const expanded = typeof isExpanded === "boolean" ? isExpanded : expandedLocal;
  const previewId = `task-preview-${task.id}`;

  // Keep expand/collapse purely local UI; parent can hand us the open task id to keep only one row expanded
  const handleToggleExpand = () => {
    if (!hasPreviewContent) return;
    if (onToggleExpand) {
      onToggleExpand(task.id);
    } else {
      setExpandedLocal((prev) => !prev);
    }
  };

  const collapseExpanded = () => {
    if (onCollapse) onCollapse();
    if (!onToggleExpand) setExpandedLocal(false);
  };

  // Check if this is a completed one-off task that can't be reactivated
  const isCompletedOneOff =
    task.task_type === "one_off" && task.archived_at !== null;
  const canToggleActive = !isCompletedOneOff;

  async function handleUpdate() {
    setPending(true);
    setError(null);
    try {
      await updateTaskTemplate(task.id, {
        title,
        category,
        task_type: taskType,
        difficulty,
        notes: notes || null,
        url: url || null,
        due_date: dueDate || null,
        due_time: dueTime || null,
        list_name: listName || null,
        details: details || null,
        priority: priority,
        project_id: projectId || null,
        recurrence_interval_days:
          taskType === "recurring"
            ? (() => {
                const n = Number(recurrenceIntervalDays);
                return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
              })()
            : null,
        recurrence_days_mask:
          taskType === "recurring"
            ? Array.from(repeatDays).reduce((mask, d) => mask | (1 << d), 0)
            : null,
      });
      setEditing(false);
      onUpdated?.({
        id: task.id,
        title,
        category,
        task_type: taskType,
        difficulty,
        notes: notes || null,
        url: url || null,
        due_date: dueDate || null,
        due_time: dueTime || null,
        list_name: listName || null,
        details: details || null,
        priority: priority,
        project_id: projectId || null,
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        "Delete this task? This cannot be undone and will remove all related logs."
      )
    )
      return;
    setPending(true);
    setError(null);
    try {
      await deleteTask(task.id);
      router.refresh(); // Refresh the page to remove the deleted task from the list
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPending(false);
    }
  }

  async function handleToggleActive() {
    setPending(true);
    setError(null);
    const nextActive = !task.is_active;
    try {
      await setTaskActive(task.id, nextActive);
      if (!nextActive) {
        // Collapse the preview when a task is completed/deactivated
        collapseExpanded();
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 transition-all">
      <div className="space-y-3">
        {editing ? (
          <div className="space-y-4">
            <div>
              <label htmlFor={`task-title-${task.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title
              </label>
              <input
                id={`task-title-${task.id}`}
                className="w-full rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white p-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={pending}
              />
            </div>
            <div>
              <label htmlFor={`task-category-${task.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                id={`task-category-${task.id}`}
                className="w-full rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white p-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={pending}
              >
                {allCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor={`task-type-${task.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Task type
                </label>
                <select
                  id={`task-type-${task.id}`}
                  className="w-full rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value as TaskType)}
                  disabled={pending}
                >
                  <option value="recurring">recurring</option>
                  <option value="one_off">one-off</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority
                </label>
                <div className="flex gap-2">
                  {(["none","low","medium","high"] as PriorityLevel[]).map((level) => {
                    const config = PriorityConfig[level];
                    const isSelected = priority === level;
                    const outline = (() => {
                      switch (level) {
                        case "high":
                          return "border-red-500 dark:border-red-400 ring-2 ring-red-500/50 ring-offset-2 ring-offset-white dark:ring-offset-gray-900";
                        case "medium":
                          return "border-orange-500 dark:border-orange-400 ring-2 ring-orange-500/50 ring-offset-2 ring-offset-white dark:ring-offset-gray-900";
                        case "low":
                          return "border-yellow-500 dark:border-yellow-400 ring-2 ring-yellow-500/50 ring-offset-2 ring-offset-white dark:ring-offset-gray-900";
                        case "none":
                        default:
                          return "border-white dark:border-white ring-2 ring-white/50 ring-offset-2 ring-offset-white dark:ring-offset-gray-900";
                      }
                    })();
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setPriority(level)}
                        disabled={pending}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all border-2 ${
                          isSelected
                            ? `${config.textColor} bg-transparent dark:bg-transparent ${outline}`
                            : `border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:${config.hoverBg}`
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Advanced options toggle for editing only */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-2"
              disabled={pending}
            >
              <span>{showAdvanced ? "▼" : "▶"}</span>
              <span>Details</span>
            </button>

            {showAdvanced && (
              <div className="space-y-3 border-t dark:border-gray-700 pt-3">
                {taskType === "recurring" && (
                  <div>
                    <label
                      htmlFor={`task-interval-${task.id}`}
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Repeat every (days)
                    </label>
                    <input
                      id={`task-interval-${task.id}`}
                      type="number"
                      min={1}
                      step={1}
                      value={recurrenceIntervalDays}
                      onChange={(e) => setRecurrenceIntervalDays(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white p-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={pending}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Default is 1 (daily).
                    </p>

                    {/* Weekly day picker */}
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Repeat on days (optional)
                      </p>
                      <div className="flex gap-2">
                        {["S", "M", "T", "W", "T", "F", "S"].map((label, idx) => {
                          const active = repeatDays.has(idx);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => toggleRepeatDay(idx)}
                              className={`h-9 w-9 rounded-full border text-sm font-semibold transition-colors ${
                                active
                                  ? "bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500 ring-2 ring-blue-500/60 ring-offset-2 ring-offset-white dark:ring-offset-gray-900"
                                  : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                              }`}
                              aria-label={`Repeat on ${label}`}
                              disabled={pending}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Difficulty</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((level) => {
                      const active = difficulty === level;
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setDifficulty(level)}
                          className={`h-8 w-8 rounded-full border text-xs font-semibold transition-colors ${
                            active
                              ? "bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500 ring-2 ring-blue-500/60 ring-offset-2 ring-offset-white dark:ring-offset-gray-900"
                              : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                          }`}
                          aria-label={`Difficulty ${level}`}
                          disabled={pending}
                        >
                          {level}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white p-2 text-sm"
                  disabled={pending}
                />
                <input
                  type="url"
                  placeholder="URL..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white p-2 text-sm"
                  disabled={pending}
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor={`task-due-date-${task.id}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Due date</label>
                    <input
                      id={`task-due-date-${task.id}`}
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white p-2 text-sm"
                      disabled={pending}
                    />
                  </div>
                  <div>
                    <label htmlFor={`task-due-time-${task.id}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Due time</label>
                    <input
                      id={`task-due-time-${task.id}`}
                      type="time"
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white p-2 text-sm"
                      disabled={pending}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Project
                  </label>
                  <ProjectSelector
                    value={projectId}
                    onChange={setProjectId}
                    disabled={pending}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Details..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white p-2 text-sm"
                  disabled={pending}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleToggleExpand}
                disabled={!hasPreviewContent || pending}
                className={`flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  !hasPreviewContent ? "opacity-60 cursor-default" : ""
                }`}
                title={hasPreviewContent ? "Show task context" : "No extra context"}
              >
                <span
                  className={`text-base transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
                  aria-hidden
                >
                  ›
                </span>
                <span className="sr-only">Toggle task details</span>
              </button>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-base text-gray-900 dark:text-gray-50 truncate">
                    {title}
                  </h3>
                  {isCompletedOneOff && (
                    <span className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">
                      completed
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                  {/* Priority pill */}
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${priorityConfig.bgColor} ${priorityConfig.textColor}`}
                    aria-label={`Priority: ${priorityBadgeLabel}`}
                  >
                    {priorityBadgeLabel}
                  </span>

                  {/* Difficulty pill with label */}
                  {(() => {
                    const label = (() => {
                      if (difficulty <= 2) return "Easy";
                      if (difficulty === 3) return "Medium";
                      if (difficulty === 4) return "Hard";
                      return "Very Hard";
                    })();
                    const cls = (() => {
                      if (difficulty <= 2) return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-200";
                      if (difficulty === 3) return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-200";
                      if (difficulty === 4) return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200";
                      return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-200";
                    })();
                    return (
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${cls}`} aria-label={`Difficulty: ${label}`}>
                        {label}
                      </span>
                    );
                  })()}

                  {/* Category */}
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {category || "Uncategorized"}
                  </span>

                  {/* Schedule */}
                  {hasSchedule && (
                    <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      {formattedDueDate ? `Due ${formattedDueDate}${dueTime ? ", " + dueTime : ""}` : scheduleParts.join(" • ")}
                    </span>
                  )}

                  {/* Type pill at end */}
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${
                      task.task_type === "one_off"
                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200"
                        : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                    }`}
                  >
                    {task.task_type === "one_off" ? "One-off" : "Recurring"}
                  </span>
                </div>
              </div>
            </div>

            <TaskDetailsPreview
              id={previewId}
              isOpen={expanded}
              category={category || task.category}
              projectName={projectLabel}
              taskType={task.task_type}
              dueDate={dueDate}
              dueTime={dueTime}
              notes={notes || null}
              details={details || null}
              tags={undefined}
              priorityLabel={showPriorityInPreview ? priorityBadgeLabel : undefined}
            />

            {error && (
              <p className="text-sm text-red-500 dark:text-red-400 mt-2">
                {error}
              </p>
            )}
            {isCompletedOneOff && !editing && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                {TaskBehavior.getReactivationBlockedMessage()}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-4">
        <button
          type="button"
          className={`flex-1 rounded-lg py-2.5 px-3 text-sm font-medium transition-colors ${
            canToggleActive
              ? "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-600 opacity-50 cursor-not-allowed"
          }`}
          onClick={handleToggleActive}
          disabled={pending || !canToggleActive}
          title={
            !canToggleActive
              ? TaskBehavior.getReactivationBlockedMessage()
              : undefined
          }
        >
          {task.is_active ? "Deactivate" : "Activate"}
        </button>

        <button
          type="button"
          className="flex-1 rounded-lg bg-blue-600 dark:bg-blue-700 text-white py-2.5 px-3 text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-800 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          onClick={() => {
            if (editing) {
              handleUpdate();
            } else {
              setEditing(true);
            }
          }}
          disabled={pending}
        >
          {editing ? "Save" : "Edit"}
        </button>

        <button
          type="button"
          className="flex-1 rounded-lg bg-red-600 dark:bg-red-700 text-white py-2.5 px-3 text-sm font-medium hover:bg-red-700 dark:hover:bg-red-800 active:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          onClick={handleDelete}
          disabled={pending}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
