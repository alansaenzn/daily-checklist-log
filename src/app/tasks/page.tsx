import { supabaseServer } from "@/lib/supabase/server";
import { createTaskTemplate, setTaskActive } from "../actions/tasks";

export default async function TasksPage() {
  const supabase = supabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user!;

  const { data: templates, error } = await supabase
    .from("task_templates")
    .select("id,title,category,is_active")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (
    <main className="mx-auto max-w-xl p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <p className="text-sm text-gray-600">
          Create and manage your daily templates.
        </p>
      </header>

      <form action={createTaskTemplate} className="space-y-3 rounded border p-4">
        <input
          name="title"
          className="w-full rounded border p-2"
          placeholder="Task title (e.g., Run 5km)"
          required
        />
        <input
          name="category"
          className="w-full rounded border p-2"
          placeholder="Category (e.g., Training)"
          defaultValue="General"
        />
        <button className="w-full rounded bg-black text-white p-2">
          Add task
        </button>
      </form>

      <section className="space-y-2">
        {(templates ?? []).map((t) => (
          <form
            key={t.id as string}
            action={async () => {
              "use server";
              await setTaskActive(t.id as string, !(t.is_active as boolean));
            }}
            className="flex items-center justify-between rounded border p-3"
          >
            <div>
              <div className="font-medium">{t.title as string}</div>
              <div className="text-xs text-gray-500">
                {t.category as string}
              </div>
            </div>
            <button className="rounded border px-3 py-2">
              {t.is_active ? "Deactivate" : "Activate"}
            </button>
          </form>
        ))}
      </section>
    </main>
  );
}
