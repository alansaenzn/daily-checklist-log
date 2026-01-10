"use client";

import Link from "next/link";
import React from "react";
import { useUserSettings } from "@/components/UserSettingsProvider";
import { Toggle } from "@/components/settings/Toggle";
import { Slider } from "@/components/settings/Slider";
import { ThresholdEditor } from "@/components/settings/ThresholdEditor";
import { DangerZoneModal } from "@/components/settings/DangerZoneModal";
import { TimezoneSelect } from "@/components/settings/TimezoneSelect";
import {
  intensityThresholdsFromSettings,
  type DefaultPriority,
  type ThemePreference,
} from "@/lib/user-settings";
import {
  deleteAccount,
  exportUserData,
  resetUserStreaks,
} from "@/app/dashboard/settings/actions/updateUserSettings";

type ToastState = { tone: "success" | "error"; message: string } | null;

const THEME_OPTIONS: { label: string; value: ThemePreference }[] = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
];

const PRIORITY_OPTIONS: { label: string; value: DefaultPriority }[] = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

function Toast({ tone, message }: { tone: "success" | "error"; message: string }) {
  return (
    <div
      className={`fixed left-1/2 top-6 z-40 w-[90%] max-w-sm -translate-x-1/2 rounded-full px-4 py-2 text-sm font-semibold shadow-lg ${
        tone === "success"
          ? "bg-emerald-500 text-white"
          : "bg-rose-500 text-white"
      }`}
      role="status"
    >
      {message}
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 w-40 rounded bg-white/10" />
      <div className="h-32 rounded-2xl bg-white/5" />
      <div className="h-32 rounded-2xl bg-white/5" />
      <div className="h-32 rounded-2xl bg-white/5" />
    </div>
  );
}

export function DashboardSettingsView() {
  const { settings, updateSettings, status, error, userEmail, isHydrated } = useUserSettings();
  const [toast, setToast] = React.useState<ToastState>(null);
  const [exporting, setExporting] = React.useState(false);
  const [resetOpen, setResetOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [resetting, setResetting] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const intensityThresholds = intensityThresholdsFromSettings(settings);

  const detectedTimezone = React.useMemo(() => {
    if (typeof Intl === "undefined") return null;
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  }, []);

  const autoTimezoneSet = React.useRef(false);

  React.useEffect(() => {
    if (autoTimezoneSet.current) return;
    if (!settings.timezone && detectedTimezone) {
      autoTimezoneSet.current = true;
      updateSettings({ timezone: detectedTimezone }, { debounceMs: 600 });
    }
  }, [detectedTimezone, settings.timezone, updateSettings]);

  React.useEffect(() => {
    if (status === "saved") {
      setToast({ tone: "success", message: "Settings saved" });
    }
    if (status === "error" && error) {
      setToast({ tone: "error", message: error });
    }
  }, [error, status]);

  React.useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => {
      setToast(null);
    }, 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await exportUserData();
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      link.click();
      URL.revokeObjectURL(url);
      setToast({ tone: "success", message: "Export ready" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Export failed.";
      setToast({ tone: "error", message });
    } finally {
      setExporting(false);
    }
  };

  const saveStatusText =
    status === "saving"
      ? "Saving…"
      : status === "saved"
        ? "Saved"
        : status === "error"
          ? "Fix errors to save"
          : "Up to date";

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="mx-auto w-full max-w-md px-5 pb-12 pt-6">
          <SettingsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {toast && <Toast tone={toast.tone} message={toast.message} />}
      <div className="mx-auto w-full max-w-md space-y-8 px-5 pb-12 pt-6">
        <div className="relative flex items-center justify-center">
          <Link
            href="/dashboard"
            className="absolute left-0 text-sm font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Settings</h1>
          <span className="absolute right-0 text-xs font-semibold text-gray-500 dark:text-gray-400">{saveStatusText}</span>
        </div>

        <section className="space-y-3">
          <p className="text-xs font-semibold tracking-[0.2em] text-gray-500 dark:text-gray-400">PROFILE</p>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-4">
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400">Display Name</label>
              <input
                type="text"
                value={settings.displayName ?? ""}
                onChange={(e) => updateSettings({ displayName: e.target.value }, { debounceMs: 600 })}
                placeholder="Add your name"
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400">Email</label>
              <input
                type="email"
                value={userEmail ?? "—"}
                readOnly
                title="Email"
                aria-label="Email address"
                className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400">Timezone</label>
              <TimezoneSelect
                value={settings.timezone}
                detectedTimezone={detectedTimezone}
                onChange={(tz) => updateSettings({ timezone: tz }, { debounceMs: 600 })}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="settings-week-start" className="text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400">Start of Week</label>
              <select
                id="settings-week-start"
                value={settings.weekStart}
                onChange={(e) => updateSettings({ weekStart: e.target.value as "sunday" | "monday" }, { debounceMs: 400 })}
                aria-label="Start of week"
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400"
              >
                <option value="monday">Monday</option>
                <option value="sunday">Sunday</option>
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <p className="text-xs font-semibold tracking-[0.2em] text-gray-500 dark:text-gray-400">PREFERENCES</p>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Theme</p>
              <div className="inline-flex rounded-full border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-800">
                {THEME_OPTIONS.map((opt) => {
                  const isActive = settings.theme === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      
                      onClick={() => updateSettings({ theme: opt.value })}
                      className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                        isActive ? "bg-blue-600 text-white" : "text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              <Toggle
                label="Reduced Motion"
                description="Limit UI animations"
                checked={settings.reducedMotion}
                onChange={(next) => updateSettings({ reducedMotion: next })}
              />
              <Toggle
                label="Haptic Feedback"
                description="Vibrate on key actions"
                checked={settings.hapticFeedback}
                onChange={(next) => updateSettings({ hapticFeedback: next })}
              />
              <Toggle
                label="Compact Mode"
                description="Tighter task rows"
                checked={settings.compactMode}
                onChange={(next) => updateSettings({ compactMode: next })}
              />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <p className="text-xs font-semibold tracking-[0.2em] text-gray-500 dark:text-gray-400">TASK BEHAVIOR</p>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-4">
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400">Default Priority</label>
              <div className="flex gap-2">
                {PRIORITY_OPTIONS.map((option) => {
                  const isActive = settings.defaultPriority === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateSettings({ defaultPriority: option.value })}
                      className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold ${
                        isActive ? "bg-blue-600 text-white" : "border border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-400"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <Slider
              id="default-difficulty"
              label="Default Difficulty"
              description="Used when a new task has no difficulty"
              value={settings.defaultDifficulty}
              min={1}
              max={5}
              onChange={(next) => updateSettings({ defaultDifficulty: next }, { debounceMs: 300 })}
            />

            <Slider
              id="focus-timer-minutes"
              label="Focus Timer Duration"
              description="Default duration when you play focus"
              value={settings.focusTimerMinutes}
              min={1}
              max={120}
              onChange={(next) => updateSettings({ focusTimerMinutes: next }, { debounceMs: 300 })}
              valueSuffix={settings.focusTimerMinutes === 1 ? " minute" : " minutes"}
            />

            <Slider
              id="auto-archive"
              label="Auto-archive After"
              description="Days after completion"
              value={settings.autoArchiveDays}
              min={0}
              max={30}
              onChange={(next) => updateSettings({ autoArchiveDays: next }, { debounceMs: 400 })}
              valueSuffix={settings.autoArchiveDays === 1 ? " day" : " days"}
            />

            <Slider
              id="focus-timer"
              label="Focus Timer Duration"
              description="Default minutes when starting the focus timer"
              value={settings.focusTimerMinutes}
              min={5}
              max={120}
              onChange={(next) => updateSettings({ focusTimerMinutes: next }, { debounceMs: 300 })}
              valueSuffix={settings.focusTimerMinutes === 1 ? " minute" : " minutes"}
            />

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              <Toggle
                label="Show Inactive Tasks"
                description="Include deactivated tasks in lists"
                checked={settings.showInactiveTasks}
                onChange={(next) => updateSettings({ showInactiveTasks: next })}
              />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <p className="text-xs font-semibold tracking-[0.2em] text-gray-500 dark:text-gray-400">VISUALIZATION & THRESHOLDS</p>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Set activity intensity levels used across heatmaps and calendars.
            </p>
            <ThresholdEditor
              value={intensityThresholds}
              onCommit={(next) =>
                updateSettings(
                  {
                    intensityLight: next.light,
                    intensityMedium: next.medium,
                    intensityHigh: next.high,
                    intensityPeak: next.peak,
                  },
                  { debounceMs: 400 }
                )
              }
            />
          </div>
        </section>

        <section className="space-y-3">
          <p className="text-xs font-semibold tracking-[0.2em] text-gray-500 dark:text-gray-400">NOTIFICATIONS</p>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-3">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              <Toggle
                label="Daily Reminder"
                description="Get a daily check-in"
                checked={settings.dailyReminderEnabled}
                onChange={(next) => updateSettings({ dailyReminderEnabled: next })}
              />
              <Toggle
                label="Missed Task Reminder"
                description="Alert when tasks are missed"
                checked={settings.missedTaskReminder}
                onChange={(next) => updateSettings({ missedTaskReminder: next })}
              />
              <Toggle
                label="Weekly Summary"
                description="Weekly progress recap"
                checked={settings.weeklySummary}
                onChange={(next) => updateSettings({ weeklySummary: next })}
              />
              <Toggle
                label="Streak Risk Alert"
                description="Warn before streak breaks"
                checked={settings.streakRiskAlert}
                onChange={(next) => updateSettings({ streakRiskAlert: next })}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="daily-reminder-time" className="text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400">Reminder Time</label>
              <input
                id="daily-reminder-time"
                type="time"
                value={settings.dailyReminderTime ?? ""}
                onChange={(e) =>
                  updateSettings({ dailyReminderTime: e.target.value || null }, { debounceMs: 300 })
                }
                disabled={!settings.dailyReminderEnabled}
                aria-label="Daily reminder time"
                className={`w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400 ${
                  settings.dailyReminderEnabled ? "" : "opacity-50"
                }`}
              />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <p className="text-xs font-semibold tracking-[0.2em] text-gray-500 dark:text-gray-400">DATA & ACCOUNT</p>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-3">
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="w-full rounded-full border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              {exporting ? "Preparing export…" : "Export Data (CSV)"}
            </button>
            <button
              type="button"
              onClick={() => setResetOpen(true)}
              className="w-full rounded-full border border-amber-300 px-4 py-3 text-sm font-semibold text-amber-700 hover:border-amber-400 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-950"
            >
              Reset Streaks
            </button>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="w-full rounded-full border border-rose-300 px-4 py-3 text-sm font-semibold text-rose-700 hover:border-rose-400 hover:bg-rose-50 dark:border-rose-600 dark:text-rose-400 dark:hover:bg-rose-950"
            >
              Delete Account
            </button>
          </div>
        </section>
      </div>

      <DangerZoneModal
        open={resetOpen}
        title="Reset streaks?"
        description="This removes your completion history so all streak counts reset to zero."
        confirmLabel="Reset streaks"
        loading={resetting}
        onCancel={() => setResetOpen(false)}
        onConfirm={async () => {
          setResetting(true);
          try {
            await resetUserStreaks();
            setResetOpen(false);
            setToast({ tone: "success", message: "Streaks reset" });
          } catch (err) {
            const message = err instanceof Error ? err.message : "Reset failed.";
            setToast({ tone: "error", message });
          } finally {
            setResetting(false);
          }
        }}
      />

      <DangerZoneModal
        open={deleteOpen}
        title="Delete account?"
        description="This action permanently deletes your account and all associated data."
        confirmLabel="Delete account"
        loading={deleting}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={async () => {
          setDeleting(true);
          try {
            await deleteAccount();
            window.location.href = "/login";
          } catch (err) {
            const message = err instanceof Error ? err.message : "Delete failed.";
            setToast({ tone: "error", message });
          } finally {
            setDeleting(false);
          }
        }}
      />
    </div>
  );
}
