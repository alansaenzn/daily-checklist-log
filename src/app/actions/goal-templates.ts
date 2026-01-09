"use server";

import { supabaseServer } from "@/lib/supabase/server";
import type {
  GoalTemplate,
  GoalTemplateWithTasks,
  GoalTemplateTask,
} from "@/lib/task-types";

/**
 * Fetch all available goal templates, optionally filtered by focus area
 * Shows both system templates and user-created templates
 */
export async function getGoalTemplates(focusArea?: string) {
  const supabase = supabaseServer();
  const { data: userData, error: userErr } = await supabase.auth.getUser();

  if (userErr || !userData.user) {
    throw new Error("Not authenticated");
  }

  let query = supabase
    .from("goal_templates")
    .select("*")
    .order("created_at", { ascending: false });

  // Filter by focus area if provided
  if (focusArea) {
    query = query.ilike("focus_area", `%${focusArea}%`);
  }

  // Show system templates and user's own templates
  query = query.or(
    `is_system.eq.true,created_by.eq.${userData.user.id}`
  );

  const { data, error } = await query;

  if (error) {
    const errorDetails = {
      code: error.code || 'UNKNOWN',
      message: error.message || 'Unknown error',
      details: (error as any).details,
      hint: (error as any).hint,
      status: (error as any).status,
    };
    console.error("getGoalTemplates failed:", JSON.stringify(errorDetails, null, 2));
    throw new Error(`Failed to load templates: ${error.code} - ${error.message}`);
  }

  return data as GoalTemplate[];
}

/**
 * Fetch a single goal template with all its tasks
 */
export async function getGoalTemplateWithTasks(
  templateId: string
): Promise<GoalTemplateWithTasks> {
  const supabase = supabaseServer();
  const { data: userData, error: userErr } = await supabase.auth.getUser();

  if (userErr || !userData.user) {
    throw new Error("Not authenticated");
  }

  // Get the template
  const { data: template, error: templateErr } = await supabase
    .from("goal_templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (templateErr) {
    const errorDetails = {
      code: templateErr.code,
      message: templateErr.message,
      details: (templateErr as any).details,
      hint: (templateErr as any).hint,
    };
    console.error("Failed to fetch template:", JSON.stringify(errorDetails, null, 2));
    throw new Error(`Failed to fetch template: ${templateErr.code} - ${templateErr.message}`);
  }

  if (!template) {
    throw new Error("Goal template not found");
  }

  // Verify user can view this template
  if (!template.is_system && template.created_by !== userData.user.id) {
    throw new Error("Unauthorized");
  }

  // Get all tasks in the template
  const { data: tasks, error: tasksErr } = await supabase
    .from("goal_template_tasks")
    .select("*")
    .eq("goal_template_id", templateId)
    .order("display_order", { ascending: true });

  if (tasksErr) {
    const errorDetails = {
      code: tasksErr.code,
      message: tasksErr.message,
      details: (tasksErr as any).details,
      hint: (tasksErr as any).hint,
    };
    console.error("Failed to fetch template tasks:", JSON.stringify(errorDetails, null, 2));
    throw new Error(`Failed to fetch tasks: ${tasksErr.code} - ${tasksErr.message}`);
  }

  return {
    ...template,
    tasks: tasks || [],
  } as GoalTemplateWithTasks;
}

/**
 * Apply a goal template to the current user
 *
 * This creates new task_templates for each task in the goal template.
 * Tasks are:
 * - Set as active by default
 * - Assigned to the current user
 * - Marked with the source template for reference
 *
 * The template itself is NOT linked back to live tasks after creation.
 * This allows users to edit/delete tasks independently.
 */
export async function applyGoalTemplate(goalTemplateId: string) {
  const supabase = supabaseServer();
  const { data: userData, error: userErr } = await supabase.auth.getUser();

  if (userErr || !userData.user) {
    throw new Error("Not authenticated");
  }

  // Get the template with tasks
  const templateWithTasks = await getGoalTemplateWithTasks(goalTemplateId);

  if (!templateWithTasks.tasks || templateWithTasks.tasks.length === 0) {
    throw new Error("Template has no tasks to apply");
  }

  // Create task_templates for each task in the goal template
  const tasksToCreate = templateWithTasks.tasks.map((task) => ({
    user_id: userData.user.id,
    title: task.title,
    category: task.category,
    task_type: "recurring" as const, // All template tasks start as recurring
    is_active: true,
    archived_at: null,
    goal_template_id: goalTemplateId,
    applied_from_template_name: templateWithTasks.name,
  }));

  const { error } = await supabase
    .from("task_templates")
    .insert(tasksToCreate);

  if (error) {
    const errorDetails = {
      code: error.code,
      message: error.message,
      details: (error as any).details,
      hint: (error as any).hint,
    };
    console.error("Failed to apply goal template:", JSON.stringify(errorDetails, null, 2));
    throw new Error(`Failed to apply template: ${error.code} - ${error.message}`);
  }

  return {
    success: true,
    templatesCreated: tasksToCreate.length,
    templateName: templateWithTasks.name,
  };
}

/**
 * Create a new goal template with tasks (admin/user-created)
 * For future use: allows power users to create custom templates
 */
export async function createGoalTemplate(
  name: string,
  description: string | null,
  focusArea: string,
  tasks: Array<{
    title: string;
    description?: string;
    category?: string;
    isOptional?: boolean;
    estimatedDurationMinutes?: number;
  }>
) {
  const supabase = supabaseServer();
  const { data: userData, error: userErr } = await supabase.auth.getUser();

  if (userErr || !userData.user) {
    throw new Error("Not authenticated");
  }

  if (!name.trim()) {
    throw new Error("Template name is required");
  }

  if (tasks.length === 0) {
    throw new Error("Template must have at least one task");
  }

  // Create the template
  const { data: template, error: templateErr } = await supabase
    .from("goal_templates")
    .insert({
      name: name.trim(),
      description,
      focus_area: focusArea.trim(),
      created_by: userData.user.id,
      is_system: false,
    })
    .select()
    .single();

  if (templateErr || !template) {
    throw new Error(`Failed to create template: ${templateErr?.message}`);
  }

  // Create tasks for the template
  const tasksToCreate = tasks.map((task, index) => ({
    goal_template_id: template.id,
    title: task.title.trim(),
    description: task.description || null,
    category: task.category || "General",
    is_optional: task.isOptional || false,
    estimated_duration_minutes: task.estimatedDurationMinutes || null,
    display_order: index,
  }));

  const { error: tasksErr } = await supabase
    .from("goal_template_tasks")
    .insert(tasksToCreate);

  if (tasksErr) {
    // Clean up the template we just created
    await supabase.from("goal_templates").delete().eq("id", template.id);
    throw new Error(`Failed to add tasks: ${tasksErr.message}`);
  }

  return {
    id: template.id,
    name: template.name,
    focusArea: template.focus_area,
    taskCount: tasks.length,
  };
}
