/**
 * Templates Page
 * Design & Management
 * 
 * Unified templates page with segmented control:
 * - Recommended: System templates (apply-focused, read-only)
 * - My Templates: User-created templates (editable, duplicable, deletable)
 */

import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { TemplatesView } from "@/components/TemplatesView";
import type { GoalTemplate } from "@/lib/task-types";

export const metadata = {
  title: "Templates",
  description: "Browse and manage your task templates",
};

async function getInitialTemplates(): Promise<GoalTemplate[]> {
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
    const errorDetails = {
      code: error.code || 'UNKNOWN',
      message: error.message || 'Unknown error',
      details: (error as any).details || null,
      hint: (error as any).hint || null,
      status: (error as any).status || null,
    };
    console.error("Failed to load goal templates:", JSON.stringify(errorDetails, null, 2));
    return [];
  }

  return data || [];
}

export default async function TemplatesPage() {
  await requireAuth();
  const templates = await getInitialTemplates();

  return (
    <main className="mx-auto max-w-xl px-4 py-6 min-h-screen">
      <TemplatesView templates={templates} />
    </main>
  );
}
