import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  const supabase = supabaseServer();

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  // After session, ensure profile exists and route based on onboarding
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/sign-in`);
  }

  // Upsert profile row with defaults if missing
  await supabase
    .from("profiles")
    .upsert({ id: user.id }, { onConflict: "id" });

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  const target = profile?.onboarding_completed ? "/dashboard" : "/onboarding";
  return NextResponse.redirect(`${origin}${target}`);
}
