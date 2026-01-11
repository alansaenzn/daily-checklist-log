"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

type Difficulty = "easy" | "moderate" | "heavy";
type Category = "daily" | "work" | "health" | "mixed";
type DailyGoal = 3 | 5 | 10;

interface Prefs {
  default_category: Category;
  default_difficulty: Difficulty;
  show_difficulty: boolean;
  daily_task_goal: DailyGoal;
}

type Step = 0 | 1 | 2 | 3;

const CATEGORY_CONFIG: Record<Category, { label: string; description: string }> = {
  daily: { label: "Daily rhythms", description: "habits & routines" },
  work: { label: "Work & projects", description: "focus & deadlines" },
  health: { label: "Health & movement", description: "training & recovery" },
  mixed: { label: "A mix of everything", description: "life isn't one lane" },
};

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; description: string }> = {
  easy: { label: "Easy", description: "light lift" },
  moderate: { label: "Moderate", description: "requires focus" },
  heavy: { label: "Heavy", description: "takes real energy" },
};

const GOAL_CONFIG: Record<DailyGoal, { label: string; description: string }> = {
  3: { label: "3 things", description: "presence over volume" },
  5: { label: "5 things", description: "balanced & steady" },
  10: { label: "10 things", description: "momentum days" },
};

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>(0);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>({
    default_category: "mixed",
    default_difficulty: "moderate",
    show_difficulty: true,
    daily_task_goal: 5,
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/sign-in");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select(
          "onboarding_completed, default_category, default_difficulty, show_difficulty, daily_task_goal"
        )
        .eq("id", user.id)
        .single();

      if (!mounted) return;

      if (profile?.onboarding_completed) {
        router.replace("/dashboard");
      } else {
        if (profile) {
          setPrefs((prev) => ({
            ...prev,
            default_category: (profile.default_category as Category) ?? prev.default_category,
            default_difficulty: (profile.default_difficulty as Difficulty) ?? prev.default_difficulty,
            show_difficulty: profile.show_difficulty ?? prev.show_difficulty,
            daily_task_goal: (profile.daily_task_goal as DailyGoal) ?? prev.daily_task_goal,
          }));
        }
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  async function completeOnboarding() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.replace("/sign-in");

    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          onboarding_completed: true,
          default_category: prefs.default_category,
          default_difficulty: prefs.default_difficulty,
          show_difficulty: prefs.show_difficulty,
          daily_task_goal: prefs.daily_task_goal,
        },
        { onConflict: "id" }
      );

    setSaving(false);
    if (error) {
      console.error("Onboarding save error:", error);
      return;
    }
    router.replace("/dashboard");
  }

  async function skipOnboarding() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.replace("/sign-in");

    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, onboarding_completed: true }, { onConflict: "id" });

    setSaving(false);
    if (error) {
      console.error("Skip onboarding error:", error);
      return;
    }
    router.replace("/dashboard");
  }

  function ProgressDots() {
    return (
      <div className="flex gap-2 justify-center mb-8">
        {([0, 1, 2, 3] as const).map((dot) => (
          <div
            key={dot}
            className={`w-2 h-2 rounded-full transition-all ${
              dot <= step
                ? "bg-gray-300 dark:bg-gray-600"
                : "bg-gray-200 dark:bg-gray-700"
            }`}
          />
        ))}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <p className="text-gray-400">Loading…</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white px-4 pt-8 pb-6">
      <div className="mx-auto max-w-lg">
        <ProgressDots />

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="space-y-6">
            <div className="space-y-3 text-center">
              <h1 className="text-3xl font-semibold leading-snug">
                Welcome. Let's make this feel like yours.
              </h1>
              <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                This isn't about doing more. It's about seeing what matters — clearly.
              </p>
            </div>

            <div className="space-y-3 pt-4">
              <button
                onClick={() => setStep(1)}
                className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-950 py-3 rounded-lg font-medium transition-all hover:opacity-90"
              >
                Continue
              </button>
              <button
                onClick={skipOnboarding}
                disabled={saving}
                className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white py-3 rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Skipping..." : "Skip for now"}
              </button>
            </div>
          </div>
        )}

        {/* Step 1: How You Use Your Time */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">How you use your time</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                What does your day usually revolve around?
              </p>
            </div>

            <div className="space-y-2">
              {(["daily", "work", "health", "mixed"] as Category[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setPrefs({ ...prefs, default_category: cat })}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    prefs.default_category === cat
                      ? "border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-900"
                      : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                  }`}
                >
                  <p className="font-medium">{CATEGORY_CONFIG[cat].label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {CATEGORY_CONFIG[cat].description}
                  </p>
                </button>
              ))}
            </div>

            <NavigationButtons
              onBack={() => setStep(0)}
              onNext={() => setStep(2)}
            />
          </div>
        )}

        {/* Step 2: Effort, Not Pressure */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Effort, not pressure</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Some things take more out of you — and that's okay. Difficulty isn't about
                pushing harder. It's about knowing what you're carrying.
              </p>
            </div>

            <div className="space-y-2">
              {(["easy", "moderate", "heavy"] as Difficulty[]).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setPrefs({ ...prefs, default_difficulty: diff })}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    prefs.default_difficulty === diff
                      ? "border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-900"
                      : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                  }`}
                >
                  <p className="font-medium">{DIFFICULTY_CONFIG[diff].label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {DIFFICULTY_CONFIG[diff].description}
                  </p>
                </button>
              ))}
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                <input
                  type="checkbox"
                  checked={prefs.show_difficulty}
                  onChange={(e) => setPrefs({ ...prefs, show_difficulty: e.target.checked })}
                  className="w-4 h-4 rounded cursor-pointer accent-gray-900 dark:accent-white"
                />
                <span className="text-sm font-medium">Show effort circles in task list</span>
              </label>
            </div>

            <NavigationButtons
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          </div>
        )}

        {/* Step 3: What a "Good Day" Means */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">
                What a "good day" means
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                When you look back on a day and feel good — what usually happened?
              </p>
            </div>

            <div className="space-y-2">
              {([3, 5, 10] as DailyGoal[]).map((goal) => (
                <button
                  key={goal}
                  onClick={() => setPrefs({ ...prefs, daily_task_goal: goal })}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    prefs.daily_task_goal === goal
                      ? "border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-900"
                      : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                  }`}
                >
                  <p className="font-medium">{GOAL_CONFIG[goal].label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {GOAL_CONFIG[goal].description}
                  </p>
                </button>
              ))}
            </div>

            <div className="space-y-3 pt-4">
              <button
                onClick={() => setStep(2)}
                className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white py-3 rounded-lg font-medium transition-all hover:opacity-90"
              >
                Back
              </button>
              <button
                onClick={completeOnboarding}
                disabled={saving}
                className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-950 py-3 rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Finishing..." : "Go to dashboard"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function NavigationButtons({
  onBack,
  onNext,
}: {
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-3 pt-4">
      <button
        onClick={onNext}
        className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-950 py-3 rounded-lg font-medium transition-all hover:opacity-90"
      >
        Continue
      </button>
      <button
        onClick={onBack}
        className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white py-3 rounded-lg font-medium transition-all hover:opacity-90"
      >
        Back
      </button>
    </div>
  );
}
