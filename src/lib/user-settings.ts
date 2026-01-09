import type { supabaseServer } from "@/lib/supabase/server";

export const DEFAULT_MOMENTUM_THRESHOLD = 5;

export function clampMomentumThreshold(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_MOMENTUM_THRESHOLD;
  return Math.min(20, Math.max(1, Math.round(value)));
}

export async function fetchUserMomentumThreshold(
  supabase: ReturnType<typeof supabaseServer>,
  userId: string
): Promise<number> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("momentum_threshold")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch user settings:", error.message);
    return DEFAULT_MOMENTUM_THRESHOLD;
  }

  const threshold = data?.momentum_threshold;
  if (typeof threshold !== "number") return DEFAULT_MOMENTUM_THRESHOLD;

  return clampMomentumThreshold(threshold);
}

export async function upsertUserMomentumThreshold(
  supabase: ReturnType<typeof supabaseServer>,
  userId: string,
  momentumThreshold: number
): Promise<void> {
  const threshold = clampMomentumThreshold(momentumThreshold);

  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: userId,
      momentum_threshold: threshold,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new Error(error.message);
  }
}
