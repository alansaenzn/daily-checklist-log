"use server";

import { supabaseServer } from "@/lib/supabase/server";
import {
  fetchUserSettings,
  normalizeUserSettings,
  upsertUserSettings,
  userSettingsSchema,
  userSettingsUpdateSchema,
  type UserSettingsUpdate,
} from "@/lib/user-settings";
import { supabaseAdmin } from "@/lib/supabase/admin";

type ExportResult = {
  filename: string;
  csv: string;
};

function csvValue(value: unknown) {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (stringValue.includes(",") || stringValue.includes("\"") || stringValue.includes("\n")) {
    return `"${stringValue.replace(/\"/g, "\"\"")}"`;
  }
  return stringValue;
}

export async function updateUserSettings(update: UserSettingsUpdate) {
  const parsed = userSettingsUpdateSchema.safeParse(update);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid settings update.");
  }

  const supabase = supabaseServer();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    throw new Error("Not authenticated");
  }

  const current = await fetchUserSettings(supabase, userData.user.id);
  const candidate = normalizeUserSettings({ ...current, ...parsed.data });
  const validated = userSettingsSchema.safeParse(candidate);
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? "Invalid settings.");
  }
  const saved = await upsertUserSettings(supabase, userData.user.id, validated.data);

  return { settings: saved };
}

export async function exportUserData(): Promise<ExportResult> {
  const supabase = supabaseServer();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    throw new Error("Not authenticated");
  }

  const userId = userData.user.id;
  const [{ data: tasks, error: tasksError }, { data: logs, error: logsError }, { data: projects, error: projectError }] =
    await Promise.all([
      supabase
        .from("task_templates")
        .select("id,title,category,task_type,difficulty,priority,project_id,is_active,archived_at,created_at,updated_at")
        .eq("user_id", userId),
      supabase
        .from("daily_task_logs")
        .select("id,task_template_id,log_date,completed,completed_at,created_at")
        .eq("user_id", userId),
      supabase
        .from("projects")
        .select("id,name,created_at,updated_at")
        .eq("user_id", userId),
    ]);

  if (tasksError) throw new Error(tasksError.message);
  if (logsError) throw new Error(logsError.message);
  if (projectError) throw new Error(projectError.message);

  const rows: string[] = [];
  const headers = [
    "record_type",
    "id",
    "title",
    "category",
    "task_type",
    "difficulty",
    "priority",
    "project_id",
    "is_active",
    "archived_at",
    "log_date",
    "completed",
    "completed_at",
    "created_at",
    "updated_at",
  ];
  rows.push(headers.join(","));

  (tasks ?? []).forEach((task) => {
    rows.push(
      [
        "task_template",
        task.id,
        task.title,
        task.category,
        task.task_type,
        task.difficulty,
        task.priority,
        task.project_id,
        task.is_active,
        task.archived_at,
        "",
        "",
        "",
        task.created_at,
        task.updated_at,
      ]
        .map(csvValue)
        .join(",")
    );
  });

  (logs ?? []).forEach((log) => {
    rows.push(
      [
        "daily_task_log",
        log.id,
        "",
        "",
        "",
        "",
        "",
        log.task_template_id,
        "",
        "",
        log.log_date,
        log.completed,
        log.completed_at,
        log.created_at,
        "",
      ]
        .map(csvValue)
        .join(",")
    );
  });

  (projects ?? []).forEach((project) => {
    rows.push(
      [
        "project",
        project.id,
        project.name,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        project.created_at,
        project.updated_at,
      ]
        .map(csvValue)
        .join(",")
    );
  });

  const filename = `checklist-log-export-${new Date().toISOString().slice(0, 10)}.csv`;
  return { filename, csv: rows.join("\n") };
}

export async function resetUserStreaks() {
  const supabase = supabaseServer();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("daily_task_logs")
    .delete()
    .eq("user_id", userData.user.id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteAccount() {
  const supabase = supabaseServer();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    throw new Error("Not authenticated");
  }

  const admin = supabaseAdmin();
  const { error } = await admin.auth.admin.deleteUser(userData.user.id);

  if (error) {
    throw new Error(error.message);
  }
}
