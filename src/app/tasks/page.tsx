import { supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TasksView } from "@/components/TasksView";
import type { GoalTemplate } from "@/lib/task-types";
import { UserSettingsProvider } from "@/components/UserSettingsProvider";
import { fetchUserSettings } from "@/lib/user-settings";

async function getGoalTemplates(): Promise<GoalTemplate[]> {
  const supabase = supabaseServer();
  const { data: userData, error: userErr } = await supabase.auth.getUser();

  if (userErr || !userData.user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("goal_templates")
    .select("*")
    .or(`is_system.eq.true,created_by.eq.${userData.user.id}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load goal templates:", error.message);
    return [];
  }

  return data || [];
}

export const metadata = {
  title: "Tasks",
  description: "Manage your active tasks and templates",
};

export default async function TasksPage() {
  const supabase = supabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user!;
  const settings = await fetchUserSettings(supabase, user.id);

  // Fetch task templates for Active tab (exclude archived tasks)
  const { data: templates, error } = await supabase
    .from("task_templates")
    .select("id,title,category,is_active,task_type,archived_at,notes,url,due_date,due_time,list_name,details,project_id,priority,created_at,recurrence_interval_days,recurrence_days_mask")
    .eq("user_id", user.id)
    .is("archived_at", null)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  // Extract unique categories with counts for management UI
  const categoryCounts: Record<string, number> = {};
  (templates ?? []).forEach((t) => {
    const name = t.category?.trim() || "General";
    categoryCounts[name] = (categoryCounts[name] || 0) + 1;
  });

  if (!categoryCounts["General"]) {
    categoryCounts["General"] = 0;
  }

  const categories = Object.entries(categoryCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Fetch goal templates for Templates tab
  const goalTemplates = await getGoalTemplates();

  return (
    <UserSettingsProvider
      initialSettings={settings}
      userEmail={user.email ?? null}
      userId={user.id}
    >
      <main className="mx-auto max-w-xl px-4 py-6 min-h-screen">
        <TasksView
          taskTemplates={templates || []}
          categories={categories}
          templates={goalTemplates}
        />
      </main>
    </UserSettingsProvider>
  );
}
