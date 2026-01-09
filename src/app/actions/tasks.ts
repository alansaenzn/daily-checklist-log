"use server";
import { supabaseServer } from "@/lib/supabase/server";
import { formatLocalDate } from "@/lib/local-date";
import { TaskBehavior, TaskValidation, type TaskType, type TaskPriority, TASK_PRIORITY_LEVELS } from "@/lib/task-types";

export async function updateTaskTemplate(
  taskTemplateId: string,
  updates: {
    title?: string;
    category?: string;
    task_type?: TaskType;
    difficulty?: number | null; // 1-5
    notes?: string | null;
    url?: string | null;
    due_date?: string | null;
    due_time?: string | null;
    list_name?: string | null;
    details?: string | null;
    priority?: TaskPriority; // Priority level
    project_id?: string | null; // Project assignment
    recurrence_interval_days?: number | null; // Recurring interval in days
    recurrence_days_mask?: number | null; // Weekly day bitmask (0..127)
  }
) {
  const supabase = supabaseServer();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) throw new Error("Not authenticated");

  // If converting task type, validate it's safe to do so
  if (updates.task_type && updates.task_type !== "recurring") {
    // Check how many completion logs exist
    const { data: logs, error: logsErr } = await supabase
      .from("daily_task_logs")
      .select("id")
      .eq("task_template_id", taskTemplateId)
      .eq("completed", true);

    if (logsErr) throw new Error(logsErr.message);

    const completionCount = logs?.length ?? 0;
    if (!TaskValidation.canConvertToOneOff("recurring", completionCount)) {
      throw new Error(TaskValidation.getConversionError(completionCount));
    }
  }

  const { error } = await supabase
    .from("task_templates")
    .update(updates)
    .eq("id", taskTemplateId)
    .eq("user_id", userData.user.id);

  if (error) throw new Error(error.message);
}

export async function createTaskTemplate(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const category = String(formData.get("category") || "General").trim();
  const taskType = String(formData.get("task_type") || "recurring") as TaskType;

  // Difficulty (1-5). Defaults to 3.
  const difficultyRaw = formData.get("difficulty");
  const difficultyParsed = Number(difficultyRaw);
  const difficulty =
    Number.isFinite(difficultyParsed) && difficultyParsed >= 1 && difficultyParsed <= 5
      ? Math.floor(difficultyParsed)
      : 3;

  // Optional extended fields
  const notes = formData.get("notes") ? String(formData.get("notes")).trim() : null;
  const url = formData.get("url") ? String(formData.get("url")).trim() : null;
  const due_date = formData.get("due_date") ? String(formData.get("due_date")) : null;
  const due_time = formData.get("due_time") ? String(formData.get("due_time")) : null;
  const list_name = formData.get("list_name") ? String(formData.get("list_name")).trim() : null;
  const details = formData.get("details") ? String(formData.get("details")).trim() : null;
  
  // Priority level (defaults to "none" if not provided)
  const priorityValue = formData.get("priority") ? String(formData.get("priority")).trim() : "none";
  const priority = TASK_PRIORITY_LEVELS.includes(priorityValue as TaskPriority) 
    ? (priorityValue as TaskPriority) 
    : "none";
  
  // Project selection (empty string or null = Inbox, UUID = specific project)
  const project_id = formData.get("project_id") ? String(formData.get("project_id")).trim() : null;

  // Recurrence interval (days) for recurring tasks, default 1
  let recurrence_interval_days: number | null = null;
  let recurrence_days_mask: number | null = null;
  if (taskType === "recurring") {
    const intervalValue = formData.get("recurrence_interval_days");
    const parsed = Number(intervalValue);
    recurrence_interval_days =
      Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;

    const maskValue = formData.get("recurrence_days_mask");
    const maskParsed = Number(maskValue);
    if (Number.isFinite(maskParsed) && maskParsed >= 0 && maskParsed <= 127) {
      recurrence_days_mask = Math.floor(maskParsed);
    } else {
      recurrence_days_mask = null;
    }
  }

  if (!title) throw new Error("Title required");
  if (!["recurring", "one_off"].includes(taskType)) {
    throw new Error("Invalid task type");
  }

  const supabase = supabaseServer();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) throw new Error("Not authenticated");

  const { error } = await supabase.from("task_templates").insert({
    user_id: userData.user.id,
    title,
    category,
    task_type: taskType,
    is_active: true,
    archived_at: null,
    difficulty,
    notes,
    url,
    due_date,
    due_time,
    list_name,
    details,
    priority,
    project_id,
    recurrence_interval_days,
    recurrence_days_mask,
  });

  if (error) throw new Error(error.message);
}

/**
 * Toggle task completion for today
 * 
 * For one-off tasks:
 * - When marked complete: insert log + immediately archive the task
 * - Prevents future completions (task won't appear in checklist)
 * 
 * For recurring tasks:
 * - Insert/update log as normal
 * - Never archives
 */
export async function toggleTaskForToday(
  taskTemplateId: string,
  nextChecked: boolean
) {
  const supabase = supabaseServer();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) throw new Error("Not authenticated");

  // One-way: if attempting to uncheck, ignore
  if (!nextChecked) return;

  // Get the task template to check its type
  const { data: template, error: templateErr } = await supabase
    .from("task_templates")
    .select("task_type")
    .eq("id", taskTemplateId)
    .eq("user_id", userData.user.id)
    .single();

  if (templateErr || !template) {
    throw new Error("Task not found");
  }

  const taskType = template.task_type as TaskType;

  // If already completed today, do nothing (prevent clearing completed state)
  const { data: existingLog, error: logErr } = await supabase
    .from("daily_task_logs")
    .select("completed")
    .eq("user_id", userData.user.id)
    .eq("task_template_id", taskTemplateId)
    .eq("log_date", formatLocalDate())
    .single();

  if (!logErr && existingLog?.completed) {
    return;
  }

  // Create/update the completion log
  const payload = {
    user_id: userData.user.id,
    task_template_id: taskTemplateId,
    log_date: formatLocalDate(),
    completed: nextChecked,
    completed_at: nextChecked ? new Date().toISOString() : null,
  };

  const { error } = await supabase
    .from("daily_task_logs")
    .upsert(payload, {
      onConflict: "user_id,task_template_id,log_date",
    });

  if (error) throw new Error(error.message);

  // For one-off tasks, auto-archive immediately after marking complete
  if (nextChecked && TaskBehavior.shouldAutoArchive(taskType)) {
    const { error: archiveErr } = await supabase
      .from("task_templates")
      .update({
        archived_at: new Date().toISOString(),
        is_active: false,
      })
      .eq("id", taskTemplateId);

    if (archiveErr) {
      console.error("Failed to archive one-off task", archiveErr);
      throw new Error("Task completed but failed to archive");
    }
  }
}

export async function setTaskActive(
  taskTemplateId: string,
  isActive: boolean
) {
  const supabase = supabaseServer();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) throw new Error("Not authenticated");

  // Get template to check if it's a completed one-off
  const { data: template, error: templateErr } = await supabase
    .from("task_templates")
    .select("task_type, archived_at")
    .eq("id", taskTemplateId)
    .eq("user_id", userData.user.id)
    .single();

  if (templateErr || !template) {
    throw new Error("Task not found");
  }

  // Check if this is a completed one-off task
  if (isActive && template.task_type === "one_off" && template.archived_at) {
    throw new Error(TaskBehavior.getReactivationBlockedMessage());
  }

  const { error } = await supabase
    .from("task_templates")
    .update({ is_active: isActive })
    .eq("id", taskTemplateId)
    .eq("user_id", userData.user.id);

  if (error) throw new Error(error.message);
}

export async function deleteTask(taskTemplateId: string) {
  const supabase = supabaseServer();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) throw new Error("Not authenticated");

  // Soft delete to preserve historical logs: archive and deactivate
  const { error } = await supabase
    .from("task_templates")
    .update({
      archived_at: new Date().toISOString(),
      is_active: false,
    })
    .eq("id", taskTemplateId)
    .eq("user_id", userData.user.id);

  if (error) throw new Error(error.message);
}

/**
 * Rename a category across the user's task templates.
 * This avoids duplicate names and keeps tasks intact.
 */
export async function renameCategory(oldName: string, newName: string) {
  const supabase = supabaseServer();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) throw new Error("Not authenticated");

  const current = oldName.trim();
  const next = newName.trim();

  if (!next) throw new Error("Category name is required");
  if (current === next) return; // No-op if unchanged
  if (current === "General") throw new Error("Default category cannot be renamed");

  // Enforce uniqueness per user
  const { count: existingCount, error: existingErr } = await supabase
    .from("task_templates")
    .select("id", { head: true, count: "exact" })
    .eq("user_id", userData.user.id)
    .eq("category", next)
    .limit(1);

  if (existingErr) throw new Error(existingErr.message);
  if ((existingCount ?? 0) > 0) throw new Error("Category name already exists");

  const { error } = await supabase
    .from("task_templates")
    .update({ category: next })
    .eq("user_id", userData.user.id)
    .eq("category", current);

  if (error) throw new Error(error.message);
}

/**
 * Delete a category by reassigning tasks to "General".
 * Tasks remain; only the label changes.
 */
export async function deleteCategory(name: string) {
  const supabase = supabaseServer();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) throw new Error("Not authenticated");

  const target = name.trim();
  if (!target) throw new Error("Category name is required");
  if (target === "General") throw new Error("Default category cannot be deleted");

  const { error } = await supabase
    .from("task_templates")
    .update({ category: "General" })
    .eq("user_id", userData.user.id)
    .eq("category", target);

  if (error) throw new Error(error.message);
}
