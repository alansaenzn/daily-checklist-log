/**
 * Projects Server Actions
 * 
 * Handle project creation, updates, and queries.
 */

"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithCount {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
  task_count: number;
}

/**
 * Create a new project
 */
export async function createProject(name: string): Promise<ProjectWithCount> {
  const supabase = supabaseServer();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  
  if (userErr || !userData.user) {
    throw new Error("Not authenticated");
  }

  if (!name || name.trim().length === 0) {
    throw new Error("Project name is required");
  }

  if (name.length > 100) {
    throw new Error("Project name must be 100 characters or less");
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: userData.user.id,
      name: name.trim(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");

  return {
    id: data.id,
    name: data.name,
    description: data.description ?? null,
    created_at: data.created_at,
    task_count: 0,
  };
}

/**
 * Get all projects for the current user with task counts
 */
export async function getProjectsWithCounts(): Promise<ProjectWithCount[]> {
  const supabase = supabaseServer();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  
  if (userErr || !userData.user) {
    throw new Error("Not authenticated");
  }

  // Fetch projects with task counts
  const { data, error } = await supabase
    .from("projects")
    .select(`
      id,
      name,
      description,
      created_at
    `)
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  // For each project, count active tasks
  const projectsWithCounts = await Promise.all(
    (data || []).map(async (project) => {
      const { count } = await supabase
        .from("task_templates")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userData.user.id)
        .eq("project_id", project.id)
        .is("archived_at", null);

      return {
        id: project.id,
        name: project.name,
        description: project.description ?? null,
        created_at: project.created_at,
        task_count: count || 0,
      };
    })
  );

  return projectsWithCounts;
}

/**
 * Update a project
 */
export async function updateProject(
  projectId: string,
  name: string,
  description?: string | null
): Promise<void> {
  const supabase = supabaseServer();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  
  if (userErr || !userData.user) {
    throw new Error("Not authenticated");
  }

  if (!name || name.trim().length === 0) {
    throw new Error("Project name is required");
  }

  const payload: Record<string, any> = {
    name: name.trim(),
    updated_at: new Date().toISOString(),
  };

  // Only include description if provided so older schemas without the column do not error.
  if (typeof description !== "undefined") {
    payload.description = description === null ? null : description.trim();
  }

  const { error } = await supabase
    .from("projects")
    .update(payload)
    .eq("id", projectId)
    .eq("user_id", userData.user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

/**
 * Delete a project.
 * Tasks remain intact but are disassociated by setting project_id to null.
 */
export async function deleteProject(projectId: string): Promise<void> {
  const supabase = supabaseServer();
  const { data: userData, error: userErr } = await supabase.auth.getUser();

  if (userErr || !userData.user) {
    throw new Error("Not authenticated");
  }

  // Detach tasks first to avoid destructive deletes. This keeps task history while freeing the project link.
  const { error: detachError } = await supabase
    .from("tasks")
    .update({ project_id: null })
    .eq("project_id", projectId)
    .eq("user_id", userData.user.id);

  if (detachError) {
    throw new Error(detachError.message);
  }

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", userData.user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}
