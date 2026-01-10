import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Server-side auth check utility.
 * Returns authenticated user or redirects to login.
 * Use in server components and route handlers.
 */
export async function requireAuth() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

/**
 * Check if user is authenticated without redirecting.
 * Returns user object or null.
 */
export async function getAuthUser() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}
