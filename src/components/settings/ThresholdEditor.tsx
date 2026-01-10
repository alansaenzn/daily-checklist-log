"use client";

import React from "react";
import type { IntensityThresholds } from "@/lib/user-settings";

type ThresholdEditorProps = {
  value: IntensityThresholds;
  onCommit: (next: IntensityThresholds) => void;
};

function parseNumber(input: string) {
  const parsed = Number(input);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(1, Math.floor(parsed));
}

export function ThresholdEditor({ value, onCommit }: ThresholdEditorProps) {
  const [draft, setDraft] = React.useState(value);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setDraft(value);
  }, [value]);

  const updateField = (key: keyof IntensityThresholds, raw: string) => {
    const nextDraft = { ...draft, [key]: parseNumber(raw) };
    setDraft(nextDraft);
    if (
      nextDraft.light < nextDraft.medium &&
      nextDraft.medium < nextDraft.high &&
      nextDraft.high < nextDraft.peak
    ) {
      setError(null);
      onCommit(nextDraft);
    } else {
      setError("Thresholds must be ascending.");
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {(
          [
            ["light", "Light"],
            ["medium", "Medium"],
            ["high", "High"],
            ["peak", "Peak"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="space-y-1 text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400">
            <span>{label}</span>
            <input
              type="number"
              min={1}
              value={draft[key]}
              onChange={(e) => updateField(key, e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400"
            />
          </label>
        ))}
      </div>
      {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}
