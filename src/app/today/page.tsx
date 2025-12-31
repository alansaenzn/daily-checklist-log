import { supabaseServer } from "@/lib/supabase/server";
import TodayChecklist from "./today-checklist";

export default async function TodayPage() {
  const supabase = supabaseServer();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user!;
  const today = new Date().toISOString().slice(0, 10);

  const { data: templates, error: tErr } = await supabase
    .from("task_templates")
    .select("id,title,category,is_active")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (tErr) throw new Error(tErr.message);

  const active = (templates ?? []).filter((t) => t.is_active);

  const { data: logs, error: lErr } = await supabase
    .from("daily_task_logs")
    .select("task_template_id,completed,completed_at")
    .eq("user_id", user.id)
    .eq("log_date", today);

  if (lErr) throw new Error(lErr.message);

  const logMap = new Map<
    string,
    { completed: boolean; completed_at: string | null }
  >();
  (logs ?? []).forEach((l) => logMap.set(l.task_template_id, l));

  const items = active.map((t) => ({
    id: t.id as string,
    title: t.title as string,
    category: t.category as string,
    checked: logMap.get(t.id as string)?.completed ?? false,
  }));

  const completedCount = items.filter((i) => i.checked).length;

  return (
    <main className="mx-auto max-w-xl p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Today</h1>
        <p className="text-sm text-gray-600">
          {completedCount} / {items.length} completed
        </p>
      </header>

      <TodayChecklist initialItems={items} />
    </main>
  );
}
