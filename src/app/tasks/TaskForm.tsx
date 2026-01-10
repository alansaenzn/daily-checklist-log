"use client";
import { useEffect, useState } from "react";
import { createTaskTemplate } from "../actions/tasks";
import { TASK_CATEGORIES, TASK_PRIORITY_LEVELS, type TaskPriority, type TaskType } from "@/lib/task-types";
import { PriorityConfig } from "@/lib/priority-utils";
import DatePicker from "@/components/DatePicker";
import ProjectSelector from "@/components/ProjectSelector";
import { useUserSettings } from "@/components/UserSettingsProvider";

interface TaskFormProps {
  existingCategories: string[];
}

export default function TaskForm({ existingCategories }: TaskFormProps) {
  const { settings } = useUserSettings();
  const [selectedCategory, setSelectedCategory] = useState("General");
  const [customCategory, setCustomCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [projectId, setProjectId] = useState(""); // Empty string = Inbox (no project)
  const [priority, setPriority] = useState<TaskPriority>(settings.defaultPriority);
  const [difficulty, setDifficulty] = useState<number>(settings.defaultDifficulty);
  const [taskType, setTaskType] = useState<TaskType>("recurring");
  const [recurrenceIntervalDays, setRecurrenceIntervalDays] = useState("1");
  const [repeatDays, setRepeatDays] = useState<Set<number>>(new Set());
  const toggleRepeatDay = (idx: number) =>
    setRepeatDays((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });

  // Merge predefined and existing custom categories
  const allCategories = [
    ...TASK_CATEGORIES,
    ...existingCategories.filter((cat) => !TASK_CATEGORIES.includes(cat as any)),
  ];

  const isCustom = selectedCategory === "Custom";

  useEffect(() => {
    setPriority(settings.defaultPriority);
    setDifficulty(settings.defaultDifficulty);
  }, [settings.defaultDifficulty, settings.defaultPriority]);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    try {
      // If custom is selected and a custom category is provided, use it
      if (isCustom && customCategory.trim()) {
        formData.set("category", customCategory.trim());
      }
      
      // Add project_id if a project is selected (empty string = Inbox)
      if (projectId) {
        formData.set("project_id", projectId);
      }
      
      // Add priority
      formData.set("priority", priority);

      // Add difficulty (1-5)
      formData.set("difficulty", String(difficulty));

      if (taskType === "recurring") {
        const parsed = Number(recurrenceIntervalDays);
        const interval = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
        formData.set("recurrence_interval_days", String(interval));
        const mask = Array.from(repeatDays).reduce((acc, d) => acc | (1 << d), 0);
        if (mask > 0) formData.set("recurrence_days_mask", String(mask));
      }
      
      await createTaskTemplate(formData);
      // Clear local cache; now persisted server-side.
      try {
        const createdTitle = String(formData.get("title") || "");
        const key = `task-form-repeat-days:${createdTitle}`;
        localStorage.removeItem(key);
      } catch {}
      
      // Reset form on success
      setSelectedCategory("General");
      setCustomCategory("");
      setDueDate("");
      setProjectId("");
      setPriority(settings.defaultPriority);
      setDifficulty(settings.defaultDifficulty);
      setTaskType("recurring");
      setRecurrenceIntervalDays("1");
      
      // Reset the form element
      const form = document.querySelector("form") as HTMLFormElement;
      if (form) form.reset();
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      action={handleSubmit}
      className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-4"
    >
      <div>
        <label htmlFor="task-title-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Task title
        </label>
        <input
          id="task-title-input"
          name="title"
          className="w-full rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white p-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Run 5km"
          required
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label htmlFor="task-category-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Category
        </label>
        <select
          id="task-category-select"
          name="category"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white p-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isSubmitting}
        >
          {allCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
          <option value="Custom">Custom...</option>
        </select>

        {/* Custom category input - shown when "Custom" is selected */}
        {isCustom && (
          <input
            type="text"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white p-3 text-base mt-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter custom category"
            required={isCustom}
            disabled={isSubmitting}
            autoFocus
          />
        )}
      </div>

      {/* Task type selector */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Task Type
        </legend>
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <input
              type="radio"
              name="task_type"
              value="recurring"
              defaultChecked
              onChange={() => setTaskType("recurring")}
              className="w-4 h-4"
              disabled={isSubmitting}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 dark:text-white">Recurring</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Appears daily, can complete multiple times</div>
            </div>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <input
              type="radio"
              name="task_type"
              value="one_off"
              onChange={() => setTaskType("one_off")}
              className="w-4 h-4"
              disabled={isSubmitting}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 dark:text-white">One-off</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Complete once, then disappears</div>
            </div>
          </label>
        </div>
      </fieldset>

      {/* Advanced Options Toggle */}
      <div className="border-t dark:border-gray-700 pt-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-2"
          disabled={isSubmitting}
        >
          <span className="text-lg">{showAdvanced ? "▼" : "▶"}</span>
          <span>Advanced Options</span>
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-4">
            {taskType === "recurring" && (
              <div>
                <label htmlFor="task-repeat-days" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Repeat every (days)
                </label>
                <input
                  id="task-repeat-days"
                  type="number"
                  min={1}
                  step={1}
                  value={recurrenceIntervalDays}
                  onChange={(e) => setRecurrenceIntervalDays(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white p-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSubmitting}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Default is 1 (daily).
                </p>

                {/* Weekly day picker */}
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Repeat on days (optional)</p>
                  <div className="flex gap-2">
                    {["S","M","T","W","T","F","S"].map((label, idx) => {
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
                          disabled={isSubmitting}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                rows={3}
                className="w-full rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white p-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Additional notes..."
                disabled={isSubmitting}
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Priority
              </label>
              <div className="flex gap-2">
                {TASK_PRIORITY_LEVELS.map((level) => {
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
                      disabled={isSubmitting}
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
              <input type="hidden" name="priority" value={priority} />
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Difficulty
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Rate how hard this task usually feels (1–5).
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((level) => {
                  const active = difficulty === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setDifficulty(level)}
                      className={`h-9 w-9 rounded-full border-2 text-sm font-semibold transition-colors ${
                        active
                          ? "bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500 ring-2 ring-blue-500/60 dark:ring-blue-400/60 ring-offset-2 ring-offset-white dark:ring-offset-gray-900"
                          : "border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-400"
                      }`}
                      aria-label={`Difficulty ${level}`}
                      disabled={isSubmitting}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
              <input type="hidden" name="difficulty" value={difficulty} />
            </div>

            {/* URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL
              </label>
              <input
                type="url"
                name="url"
                className="w-full rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white p-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://..."
                disabled={isSubmitting}
              />
            </div>

            {/* Due Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Due Date
                </label>
                <div className="relative">
                  <DatePicker 
                    value={dueDate}
                    onChange={setDueDate}
                    disabled={isSubmitting}
                  />
                  <input
                    type="hidden"
                    name="due_date"
                    value={dueDate}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="task-due-time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Due Time
                </label>
                <input
                  id="task-due-time"
                  type="time"
                  name="due_time"
                  className="w-full rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white p-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Project Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Project
              </label>
              <ProjectSelector
                value={projectId}
                onChange={setProjectId}
                disabled={isSubmitting}
              />
            </div>

            {/* Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Details
              </label>
              <textarea
                name="details"
                rows={3}
                className="w-full rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white p-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Additional context or details..."
                disabled={isSubmitting}
              />
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-blue-600 dark:bg-blue-700 text-white p-3 font-medium text-base hover:bg-blue-700 dark:hover:bg-blue-800 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Adding..." : "Add task"}
      </button>
    </form>
  );
}
