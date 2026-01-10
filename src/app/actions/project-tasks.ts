"use server";

import { supabaseServer } from "@/lib/supabase/server";

export interface TaskData {
  id: string;
  title: string;
  category: string | null;
  task_type: string;
  is_active: boolean;
  created_at: string | null;
  due_date: string | null;
  due_time: string | null;
  list_name: string | null;
  project_id: string | null;
  priority?: string | null;
  difficulty?: number | null;
  notes?: string | null;
  url?: string | null;
  details?: string | null;
  archived_at?: string | null;
}

/**
 * Fetch active, non-archived tasks for a given project
 */
export async function getProjectTasks(projectId: string): Promise<TaskData[]> {
  const supabase = supabaseServer();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("task_templates")
    .select(
      "id,title,category,task_type,is_active,created_at,due_date,due_time,list_name,project_id,archived_at,notes,url,details,priority,difficulty"
    )
    .eq("user_id", userData.user.id)
    .eq("project_id", projectId)
    .is("archived_at", null)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data || []).map((t) => ({
    id: t.id,
    title: t.title,
    category: t.category ?? null,
    task_type: t.task_type,
    is_active: t.is_active,
    created_at: t.created_at ?? null,
    due_date: t.due_date ?? null,
    due_time: t.due_time ?? null,
    list_name: t.list_name ?? null,
    project_id: t.project_id ?? null,
    priority: t.priority ?? null,
    difficulty: typeof (t as any).difficulty === "number" ? (t as any).difficulty : null,
    notes: t.notes ?? null,
    url: t.url ?? null,
    details: t.details ?? null,
    archived_at: t.archived_at ?? null,
  }));
}

/**
 * Fetch active, non-archived tasks that are not assigned to any project (Inbox).
 */
export async function getUnassignedTasks(): Promise<TaskData[]> {
  const supabase = supabaseServer();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("task_templates")
    .select(
      "id,title,category,task_type,is_active,created_at,due_date,due_time,list_name,project_id,archived_at,notes,url,details,priority,difficulty"
    )
    .eq("user_id", userData.user.id)
    .is("project_id", null)
    .is("archived_at", null)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data || []).map((t) => ({
    id: t.id,
    title: t.title,
    category: t.category ?? null,
    task_type: t.task_type,
    is_active: t.is_active,
    created_at: t.created_at ?? null,
    due_date: t.due_date ?? null,
    due_time: t.due_time ?? null,
    list_name: t.list_name ?? null,
    project_id: t.project_id ?? null,
    priority: t.priority ?? null,
    difficulty: typeof (t as any).difficulty === "number" ? (t as any).difficulty : null,
    notes: t.notes ?? null,
    url: t.url ?? null,
    details: t.details ?? null,
    archived_at: t.archived_at ?? null,
  }));
}
