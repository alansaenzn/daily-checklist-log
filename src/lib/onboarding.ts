/**
 * Onboarding utilities
 * Helpers for managing onboarding preferences and flow
 */

import { supabaseServer } from "@/lib/supabase/server";

type SupabaseServerClient = ReturnType<typeof supabaseServer>;

export type DifficultyLevel = "easy" | "moderate" | "heavy";
export type Category = "daily" | "work" | "health" | "mixed";
export type DailyGoal = 3 | 5 | 10;

export interface OnboardingPrefs {
  default_category: Category;
  default_difficulty: DifficultyLevel;
  show_difficulty: boolean;
  daily_task_goal: DailyGoal;
}

export interface OnboardingProfile extends OnboardingPrefs {
  onboarding_completed: boolean;
}

/**
 * Fetch onboarding status and preferences for a user
 */
export async function fetchOnboardingStatus(
  supabase: SupabaseServerClient,
  userId: string
): Promise<OnboardingProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "onboarding_completed, default_category, default_difficulty, show_difficulty, daily_task_goal"
    )
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Failed to fetch onboarding status:", error.message);
    return null;
  }

  return data as OnboardingProfile | null;
}

/**
 * Complete onboarding and save preferences
 */
export async function completeOnboarding(
  supabase: SupabaseServerClient,
  userId: string,
  prefs?: Partial<OnboardingPrefs>
): Promise<boolean> {
  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        onboarding_completed: true,
        default_category: prefs?.default_category,
        default_difficulty: prefs?.default_difficulty,
        show_difficulty: prefs?.show_difficulty,
        daily_task_goal: prefs?.daily_task_goal,
      },
      { onConflict: "id" }
    );

  if (error) {
    console.error("Failed to complete onboarding:", error.message);
    return false;
  }

  return true;
}

/**
 * Update onboarding preferences without completing
 */
export async function updateOnboardingPrefs(
  supabase: SupabaseServerClient,
  userId: string,
  prefs: Partial<OnboardingPrefs>
): Promise<boolean> {
  const { error } = await supabase
    .from("profiles")
    .update(prefs)
    .eq("id", userId);

  if (error) {
    console.error("Failed to update onboarding preferences:", error.message);
    return false;
  }

  return true;
}

/**
 * Check if user needs to complete onboarding
 */
export function needsOnboarding(profile: OnboardingProfile | null): boolean {
  return !profile?.onboarding_completed;
}
