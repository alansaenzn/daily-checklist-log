"use server";

import { supabaseServer } from "@/lib/supabase/server";
import {
  clampMomentumThreshold,
  upsertUserMomentumThreshold,
} from "@/lib/user-settings";

export async function updateMomentumThreshold(nextThreshold: number) {
  const supabase = supabaseServer();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    throw new Error("Not authenticated");
  }

  const threshold = clampMomentumThreshold(nextThreshold);
  await upsertUserMomentumThreshold(supabase, userData.user.id, threshold);

  return { momentumThreshold: threshold };
}
