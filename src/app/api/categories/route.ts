import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = supabaseServer();
    const { data: userData, error: userErr } = await supabase.auth.getUser();

    if (userErr || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all unique categories from user's task templates
    const { data, error } = await supabase
      .from("task_templates")
      .select("category")
      .eq("user_id", userData.user.id)
      .not("category", "is", null);

    if (error) {
      console.error("Error fetching categories:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Extract unique categories
    const categories = Array.from(
      new Set(
        (data || [])
          .map((item) => item.category?.trim())
          .filter((cat): cat is string => !!cat)
      )
    );

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
