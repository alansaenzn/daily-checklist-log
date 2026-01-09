"use client";

import Link from "next/link";
import React from "react";
import { updateMomentumThreshold } from "@/app/dashboard/settings/actions/updateMomentumThreshold";
import { useMomentumSettings } from "@/components/MomentumSettingsProvider";
import { clampMomentumThreshold } from "@/lib/user-settings";

export function DashboardSettingsView() {
  const { momentumThreshold, setMomentumThreshold } = useMomentumSettings();
  const [status, setStatus] = React.useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );

  const isFirstRender = React.useRef(true);

  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      setStatus("saving");

      updateMomentumThreshold(momentumThreshold)
        .then(({ momentumThreshold: saved }) => {
          setMomentumThreshold(saved);
          setStatus("saved");
        })
        .catch(() => {
          setStatus("error");
        });
    }, 400);

    return () => clearTimeout(timer);
  }, [momentumThreshold, setMomentumThreshold]);

  const statusText =
    status === "saving"
      ? "Saving…"
      : status === "saved"
        ? "Saved"
        : status === "error"
          ? "Could not save"
          : "";

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wide">
          Settings
        </p>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-black uppercase tracking-tight">
            Dashboard Settings
          </h1>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            Back
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 space-y-4">
        <div className="space-y-1">
          <h2 className="text-sm font-bold uppercase text-gray-900 dark:text-white">
            Momentum & Scoring
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Momentum Threshold controls how the Momentum heatmap is colored.
            This changes visualization only.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label
              htmlFor="momentum-threshold"
              className="text-sm font-medium text-gray-900 dark:text-white"
            >
              Momentum Threshold
            </label>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {momentumThreshold}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {statusText}
              </span>
            </div>
          </div>

          <input
            id="momentum-threshold"
            type="range"
            min={1}
            max={20}
            step={1}
            value={momentumThreshold}
            onChange={(e) => {
              const next = clampMomentumThreshold(Number(e.target.value));
              setMomentumThreshold(next);
              setStatus("idle");
            }}
            className="w-full"
            aria-label="Momentum Threshold"
          />

          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>1</span>
            <span>20</span>
          </div>
        </div>
      </div>
    </div>
  );
}
