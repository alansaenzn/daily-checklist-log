import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = supabaseServer();
    const { data: userData, error: userErr } = await supabase.auth.getUser();

    if (userErr || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch ALL tasks from user's task templates (including inactive and archived)
    // This ensures all categories are visible when creating templates
    const { data, error } = await supabase
      .from("task_templates")
      .select("id, title, category")
      .eq("user_id", userData.user.id)
      .order("category", { ascending: true })
      .order("title", { ascending: true });

    if (error) {
      console.error("Error fetching tasks:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return tasks grouped by category
    const tasks = (data || []).map(task => ({
      id: task.id,
      title: task.title || "Untitled",
      category: task.category || "Uncategorized",
    }));

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
