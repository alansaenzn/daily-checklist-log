"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

type Difficulty = "easy" | "medium" | "hard";

interface Prefs {
  onboarding_completed: boolean;
  default_category: string;
  default_difficulty: Difficulty;
  show_difficulty: boolean;
  daily_task_goal: number;
}

type Step = 0 | 1 | 2 | 3;

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>(0);
  const [prefs, setPrefs] = useState<Prefs>({
    onboarding_completed: false,
    default_category: "general",
    default_difficulty: "medium",
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
        setPrefs((prev) => ({
          ...prev,
          default_category: profile?.default_category ?? prev.default_category,
          default_difficulty: (profile?.default_difficulty as Difficulty) ?? prev.default_difficulty,
          show_difficulty: profile?.show_difficulty ?? prev.show_difficulty,
          daily_task_goal: profile?.daily_task_goal ?? prev.daily_task_goal,
        }));
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  async function completeOnboarding() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.replace("/sign-in");
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        onboarding_completed: true,
        default_category: prefs.default_category,
        default_difficulty: prefs.default_difficulty,
        show_difficulty: prefs.show_difficulty,
        daily_task_goal: prefs.daily_task_goal,
      }, { onConflict: "id" });
    if (error) {
      alert(error.message);
      return;
    }
    router.replace("/dashboard");
  }

  async function skipOnboarding() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.replace("/sign-in");
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, onboarding_completed: true }, { onConflict: "id" });
    if (error) {
      alert(error.message);
      return;
    }
    router.replace("/dashboard");
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-md p-6">
        <p>Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md p-6 space-y-6">
      {step === 0 && (
        <section className="space-y-4">
          <h1 className="text-2xl font-semibold">Welcome</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Let’s set up a few preferences to tailor your experience.
          </p>
          <div className="flex gap-2">
            <button
              className="rounded bg-black text-white px-4 py-2"
              onClick={() => setStep(1)}
            >
              Get started
            </button>
            <button
              className="rounded border px-4 py-2"
              onClick={skipOnboarding}
            >
              Skip
            </button>
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Usage Type</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Choose your default category for tasks.
          </p>
          <input
            className="w-full rounded border p-2"
            placeholder="e.g., personal, work, health"
            value={prefs.default_category}
            onChange={(e) => setPrefs({ ...prefs, default_category: e.target.value })}
          />
          <div className="flex gap-2">
            <button className="rounded border px-4 py-2" onClick={() => setStep(0)}>
              Back
            </button>
            <button className="rounded bg-black text-white px-4 py-2" onClick={() => setStep(2)}>
              Next
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Difficulty Preferences</h2>
          <div className="space-y-2">
            <label className="block text-sm">Default difficulty</label>
            <div className="flex gap-2">
              {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  className={`rounded px-3 py-2 border ${
                    prefs.default_difficulty === d ? "bg-black text-white" : ""
                  }`}
                  onClick={() => setPrefs({ ...prefs, default_difficulty: d })}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={prefs.show_difficulty}
              onChange={(e) => setPrefs({ ...prefs, show_difficulty: e.target.checked })}
            />
            Show difficulty in task lists
          </label>
          <div className="flex gap-2">
            <button className="rounded border px-4 py-2" onClick={() => setStep(1)}>
              Back
            </button>
            <button className="rounded bg-black text-white px-4 py-2" onClick={() => setStep(3)}>
              Next
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Daily Progress</h2>
          <label className="block text-sm">Daily task goal</label>
          <input
            type="number"
            min={1}
            className="w-full rounded border p-2"
            value={prefs.daily_task_goal}
            onChange={(e) => setPrefs({ ...prefs, daily_task_goal: Number(e.target.value) })}
          />
          <div className="flex gap-2">
            <button className="rounded border px-4 py-2" onClick={() => setStep(2)}>
              Back
            </button>
            <button className="rounded bg-black text-white px-4 py-2" onClick={completeOnboarding}>
              Finish
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
