"use client";

import React from "react";
import { updateUserSettings } from "@/app/dashboard/settings/actions/updateUserSettings";
import {
  DEFAULT_USER_SETTINGS,
  userSettingsSchema,
  type UserSettings,
  type UserSettingsUpdate,
} from "@/lib/user-settings";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type UpdateOptions = {
  debounceMs?: number;
};

type UserSettingsContextValue = {
  settings: UserSettings;
  updateSettings: (patch: UserSettingsUpdate, options?: UpdateOptions) => void;
  flushPending: () => Promise<void>;
  status: SaveStatus;
  error: string | null;
  userEmail: string | null;
  userId: string | null;
  isHydrated: boolean;
};

const UserSettingsContext = React.createContext<UserSettingsContextValue | null>(null);

function getChangedFields(prev: UserSettings, next: UserSettings): UserSettingsUpdate {
  const entries = (Object.keys(next) as (keyof UserSettings)[])
    .filter((key) => prev[key] !== next[key])
    .map((key) => [key, next[key]] as const);
  return Object.fromEntries(entries) as UserSettingsUpdate;
}

function applyTheme(theme: UserSettings["theme"]) {
  const root = document.documentElement;
  if (theme === "system") {
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", Boolean(prefersDark));
    return;
  }
  root.classList.toggle("dark", theme === "dark");
}

export function UserSettingsProvider({
  initialSettings,
  userEmail,
  userId,
  children,
}: {
  initialSettings?: UserSettings | null;
  userEmail: string | null;
  userId: string | null;
  children: React.ReactNode;
}) {
  const [settings, setSettings] = React.useState<UserSettings>(() => {
    if (initialSettings) return initialSettings;
    return DEFAULT_USER_SETTINGS;
  });
  const [status, setStatus] = React.useState<SaveStatus>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [isHydrated, setIsHydrated] = React.useState(false);

  const settingsRef = React.useRef(settings);
  const pendingRef = React.useRef<UserSettingsUpdate>({});
  const saveTimeoutRef = React.useRef<number | null>(null);
  const statusTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current !== null) {
        window.clearTimeout(saveTimeoutRef.current);
      }
      if (statusTimeoutRef.current !== null) {
        window.clearTimeout(statusTimeoutRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    applyTheme(settings.theme);
  }, [settings.theme]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    root.classList.toggle("reduce-motion", settings.reducedMotion);
    root.classList.toggle("compact-mode", settings.compactMode);
  }, [settings.compactMode, settings.reducedMotion]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (settings.theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyTheme("system");
    media.addEventListener?.("change", handleChange);
    return () => media.removeEventListener?.("change", handleChange);
  }, [settings.theme]);

  const flushPending = React.useCallback(async () => {
    const patch = pendingRef.current;
    if (Object.keys(patch).length === 0) return;
    pendingRef.current = {};
    setStatus("saving");
    setError(null);

    try {
      const result = await updateUserSettings(patch);
      setSettings(result.settings);
      setStatus("saved");
      if (statusTimeoutRef.current !== null) {
        window.clearTimeout(statusTimeoutRef.current);
      }
      statusTimeoutRef.current = window.setTimeout(() => {
        setStatus("idle");
      }, 1800);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save settings.";
      setError(message);
      setStatus("error");
    }
  }, []);

  const updateSettings = React.useCallback(
    (patch: UserSettingsUpdate, options?: UpdateOptions) => {
      const candidate = { ...settingsRef.current, ...patch };
      const parsed = userSettingsSchema.safeParse(candidate);
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Invalid settings.");
        setStatus("error");
        return;
      }

      const diff = getChangedFields(settingsRef.current, parsed.data);
      if (Object.keys(diff).length === 0) return;
      setSettings(parsed.data);
      settingsRef.current = parsed.data;
      pendingRef.current = { ...pendingRef.current, ...diff };

      if (saveTimeoutRef.current !== null) {
        window.clearTimeout(saveTimeoutRef.current);
      }
      const debounceMs = options?.debounceMs ?? 0;
      if (debounceMs > 0) {
        saveTimeoutRef.current = window.setTimeout(() => {
          void flushPending();
        }, debounceMs);
      } else {
        void flushPending();
      }
    },
    [flushPending]
  );

  const value = React.useMemo(
    () => ({
      settings,
      updateSettings,
      flushPending,
      status,
      error,
      userEmail,
      userId,
      isHydrated,
    }),
    [error, flushPending, isHydrated, settings, status, updateSettings, userEmail, userId]
  );

  return <UserSettingsContext.Provider value={value}>{children}</UserSettingsContext.Provider>;
}

export function useUserSettings(): UserSettingsContextValue {
  const ctx = React.useContext(UserSettingsContext);
  if (!ctx) {
    throw new Error("useUserSettings must be used within UserSettingsProvider");
  }
  return ctx;
}
