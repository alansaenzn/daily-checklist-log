"use server";

import { supabaseServer } from "@/lib/supabase/server";

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

export async function createTaskTemplate(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const category = String(formData.get("category") || "General").trim();

  if (!title) throw new Error("Title required");

  const supabase = supabaseServer();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) throw new Error("Not authenticated");

  const { error } = await supabase.from("task_templates").insert({
    user_id: userData.user.id,
    title,
    category,
    is_active: true,
  });

  if (error) throw new Error(error.message);
}

export async function toggleTaskForToday(
  taskTemplateId: string,
  nextChecked: boolean
) {
  const supabase = supabaseServer();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) throw new Error("Not authenticated");

  const log_date = todayISODate();

  const payload = {
    user_id: userData.user.id,
    task_template_id: taskTemplateId,
    log_date,
    completed: nextChecked,
    completed_at: nextChecked ? new Date().toISOString() : null,
  };

  const { error } = await supabase.from("daily_task_logs").upsert(payload, {
    onConflict: "user_id,task_template_id,log_date",
  });

  if (error) throw new Error(error.message);
}

export async function setTaskActive(taskTemplateId: string, isActive: boolean) {
  const supabase = supabaseServer();
  const { error } = await supabase
    .from("task_templates")
    .update({ is_active: isActive })
    .eq("id", taskTemplateId);

  if (error) throw new Error(error.message);
}
