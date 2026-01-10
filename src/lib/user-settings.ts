import { z } from "zod";
import type { supabaseServer } from "@/lib/supabase/server";

export type ThemePreference = "system" | "light" | "dark";
export type WeekStart = "sunday" | "monday";
export type DefaultPriority = "low" | "medium" | "high";

export type UserSettings = {
  displayName: string | null;
  timezone: string | null;
  weekStart: WeekStart;
  theme: ThemePreference;
  reducedMotion: boolean;
  hapticFeedback: boolean;
  compactMode: boolean;
  showInactiveTasks: boolean;
  defaultPriority: DefaultPriority;
  defaultDifficulty: number;
  autoArchiveDays: number;
  intensityLight: number;
  intensityMedium: number;
  intensityHigh: number;
  intensityPeak: number;
  dailyReminderEnabled: boolean;
  dailyReminderTime: string | null;
  missedTaskReminder: boolean;
  weeklySummary: boolean;
  streakRiskAlert: boolean;
};

export type IntensityThresholds = {
  light: number;
  medium: number;
  high: number;
  peak: number;
};

export const DEFAULT_INTENSITY_THRESHOLDS: IntensityThresholds = {
  light: 3,
  medium: 6,
  high: 10,
  peak: 15,
};

export const DEFAULT_USER_SETTINGS: UserSettings = {
  displayName: null,
  timezone: null,
  weekStart: "monday",
  theme: "system",
  reducedMotion: false,
  hapticFeedback: true,
  compactMode: false,
  showInactiveTasks: true,
  defaultPriority: "medium",
  defaultDifficulty: 3,
  autoArchiveDays: 0,
  intensityLight: DEFAULT_INTENSITY_THRESHOLDS.light,
  intensityMedium: DEFAULT_INTENSITY_THRESHOLDS.medium,
  intensityHigh: DEFAULT_INTENSITY_THRESHOLDS.high,
  intensityPeak: DEFAULT_INTENSITY_THRESHOLDS.peak,
  dailyReminderEnabled: false,
  dailyReminderTime: "09:00",
  missedTaskReminder: false,
  weeklySummary: false,
  streakRiskAlert: false,
};

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const displayNameSchema = z
  .preprocess((value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }, z.string().min(1).max(80))
  .nullable();

const timezoneSchema = z
  .preprocess((value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }, z.string().min(1).max(64))
  .nullable();

const userSettingsBaseSchema = z.object({
    displayName: displayNameSchema,
    timezone: timezoneSchema,
    weekStart: z.enum(["sunday", "monday"]),
    theme: z.enum(["system", "light", "dark"]),
    reducedMotion: z.boolean(),
    hapticFeedback: z.boolean(),
    compactMode: z.boolean(),
    showInactiveTasks: z.boolean(),
    defaultPriority: z.enum(["low", "medium", "high"]),
    defaultDifficulty: z.number().int().min(1).max(5),
    autoArchiveDays: z.number().int().min(0).max(365),
    intensityLight: z.number().int().min(1),
    intensityMedium: z.number().int().min(1),
    intensityHigh: z.number().int().min(1),
    intensityPeak: z.number().int().min(1),
    dailyReminderEnabled: z.boolean(),
    dailyReminderTime: z
      .string()
      .regex(timeRegex)
      .nullable(),
    missedTaskReminder: z.boolean(),
    weeklySummary: z.boolean(),
    streakRiskAlert: z.boolean(),
  });

export const userSettingsSchema = userSettingsBaseSchema.superRefine((value, ctx) => {
    if (
      !(value.intensityLight < value.intensityMedium &&
      value.intensityMedium < value.intensityHigh &&
      value.intensityHigh < value.intensityPeak)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Intensity thresholds must be ascending.",
        path: ["intensityLight"],
      });
    }
  });

export const userSettingsUpdateSchema = userSettingsBaseSchema.partial();

export type UserSettingsUpdate = z.infer<typeof userSettingsUpdateSchema>;

export function normalizeUserSettings(input?: Partial<UserSettings> | null): UserSettings {
  const merged = { ...DEFAULT_USER_SETTINGS, ...(input ?? {}) };
  const parsed = userSettingsSchema.safeParse(merged);
  if (!parsed.success) {
    console.warn("Invalid user settings detected, falling back to defaults.");
    return DEFAULT_USER_SETTINGS;
  }
  return parsed.data;
}

export function intensityThresholdsFromSettings(settings: UserSettings): IntensityThresholds {
  return {
    light: settings.intensityLight,
    medium: settings.intensityMedium,
    high: settings.intensityHigh,
    peak: settings.intensityPeak,
  };
}

export function validateSettingsCandidate(candidate: UserSettings): UserSettings {
  return userSettingsSchema.parse(candidate);
}

type SupabaseServerClient = ReturnType<typeof supabaseServer>;

type UserSettingsRow = {
  user_id: string;
  display_name: string | null;
  timezone: string | null;
  week_start: WeekStart | null;
  theme: ThemePreference | null;
  reduced_motion: boolean | null;
  haptic_feedback: boolean | null;
  compact_mode: boolean | null;
  show_inactive_tasks: boolean | null;
  default_priority: DefaultPriority | null;
  default_difficulty: number | null;
  auto_archive_days: number | null;
  intensity_light: number | null;
  intensity_medium: number | null;
  intensity_high: number | null;
  intensity_peak: number | null;
  daily_reminder_enabled: boolean | null;
  daily_reminder_time: string | null;
  missed_task_reminder: boolean | null;
  weekly_summary: boolean | null;
  streak_risk_alert: boolean | null;
};

function mapRowToSettings(row: UserSettingsRow): Partial<UserSettings> {
  return {
    displayName: row.display_name ?? null,
    timezone: row.timezone ?? null,
    weekStart: row.week_start ?? DEFAULT_USER_SETTINGS.weekStart,
    theme: row.theme ?? DEFAULT_USER_SETTINGS.theme,
    reducedMotion: row.reduced_motion ?? DEFAULT_USER_SETTINGS.reducedMotion,
    hapticFeedback: row.haptic_feedback ?? DEFAULT_USER_SETTINGS.hapticFeedback,
    compactMode: row.compact_mode ?? DEFAULT_USER_SETTINGS.compactMode,
    showInactiveTasks: row.show_inactive_tasks ?? DEFAULT_USER_SETTINGS.showInactiveTasks,
    defaultPriority: row.default_priority ?? DEFAULT_USER_SETTINGS.defaultPriority,
    defaultDifficulty: row.default_difficulty ?? DEFAULT_USER_SETTINGS.defaultDifficulty,
    autoArchiveDays: row.auto_archive_days ?? DEFAULT_USER_SETTINGS.autoArchiveDays,
    intensityLight: row.intensity_light ?? DEFAULT_USER_SETTINGS.intensityLight,
    intensityMedium: row.intensity_medium ?? DEFAULT_USER_SETTINGS.intensityMedium,
    intensityHigh: row.intensity_high ?? DEFAULT_USER_SETTINGS.intensityHigh,
    intensityPeak: row.intensity_peak ?? DEFAULT_USER_SETTINGS.intensityPeak,
    dailyReminderEnabled: row.daily_reminder_enabled ?? DEFAULT_USER_SETTINGS.dailyReminderEnabled,
    dailyReminderTime:
      row.daily_reminder_time != null
        ? String(row.daily_reminder_time).slice(0, 5)
        : DEFAULT_USER_SETTINGS.dailyReminderTime,
    missedTaskReminder: row.missed_task_reminder ?? DEFAULT_USER_SETTINGS.missedTaskReminder,
    weeklySummary: row.weekly_summary ?? DEFAULT_USER_SETTINGS.weeklySummary,
    streakRiskAlert: row.streak_risk_alert ?? DEFAULT_USER_SETTINGS.streakRiskAlert,
  };
}

function mapSettingsPatchToRow(patch: UserSettingsUpdate) {
  const mapped: Partial<UserSettingsRow> = {};
  if ("displayName" in patch) mapped.display_name = patch.displayName ?? null;
  if ("timezone" in patch) mapped.timezone = patch.timezone ?? null;
  if ("weekStart" in patch) mapped.week_start = patch.weekStart ?? DEFAULT_USER_SETTINGS.weekStart;
  if ("theme" in patch) mapped.theme = patch.theme ?? DEFAULT_USER_SETTINGS.theme;
  if ("reducedMotion" in patch) mapped.reduced_motion = patch.reducedMotion ?? DEFAULT_USER_SETTINGS.reducedMotion;
  if ("hapticFeedback" in patch) mapped.haptic_feedback = patch.hapticFeedback ?? DEFAULT_USER_SETTINGS.hapticFeedback;
  if ("compactMode" in patch) mapped.compact_mode = patch.compactMode ?? DEFAULT_USER_SETTINGS.compactMode;
  if ("showInactiveTasks" in patch) mapped.show_inactive_tasks = patch.showInactiveTasks ?? DEFAULT_USER_SETTINGS.showInactiveTasks;
  if ("defaultPriority" in patch) mapped.default_priority = patch.defaultPriority ?? DEFAULT_USER_SETTINGS.defaultPriority;
  if ("defaultDifficulty" in patch) mapped.default_difficulty = patch.defaultDifficulty ?? DEFAULT_USER_SETTINGS.defaultDifficulty;
  if ("autoArchiveDays" in patch) mapped.auto_archive_days = patch.autoArchiveDays ?? DEFAULT_USER_SETTINGS.autoArchiveDays;
  if ("intensityLight" in patch) mapped.intensity_light = patch.intensityLight ?? DEFAULT_USER_SETTINGS.intensityLight;
  if ("intensityMedium" in patch) mapped.intensity_medium = patch.intensityMedium ?? DEFAULT_USER_SETTINGS.intensityMedium;
  if ("intensityHigh" in patch) mapped.intensity_high = patch.intensityHigh ?? DEFAULT_USER_SETTINGS.intensityHigh;
  if ("intensityPeak" in patch) mapped.intensity_peak = patch.intensityPeak ?? DEFAULT_USER_SETTINGS.intensityPeak;
  if ("dailyReminderEnabled" in patch) mapped.daily_reminder_enabled = patch.dailyReminderEnabled ?? DEFAULT_USER_SETTINGS.dailyReminderEnabled;
  if ("dailyReminderTime" in patch) mapped.daily_reminder_time = patch.dailyReminderTime ?? null;
  if ("missedTaskReminder" in patch) mapped.missed_task_reminder = patch.missedTaskReminder ?? DEFAULT_USER_SETTINGS.missedTaskReminder;
  if ("weeklySummary" in patch) mapped.weekly_summary = patch.weeklySummary ?? DEFAULT_USER_SETTINGS.weeklySummary;
  if ("streakRiskAlert" in patch) mapped.streak_risk_alert = patch.streakRiskAlert ?? DEFAULT_USER_SETTINGS.streakRiskAlert;
  return mapped;
}

export async function fetchUserSettings(
  supabase: SupabaseServerClient,
  userId: string
): Promise<UserSettings> {
  const { data, error } = await supabase
    .from("user_settings")
    .select(
      [
        "display_name",
        "timezone",
        "week_start",
        "theme",
        "reduced_motion",
        "haptic_feedback",
        "compact_mode",
        "show_inactive_tasks",
        "default_priority",
        "default_difficulty",
        "auto_archive_days",
        "intensity_light",
        "intensity_medium",
        "intensity_high",
        "intensity_peak",
        "daily_reminder_enabled",
        "daily_reminder_time",
        "missed_task_reminder",
        "weekly_summary",
        "streak_risk_alert",
      ].join(",")
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch user settings:", error.message);
    return DEFAULT_USER_SETTINGS;
  }

  if (!data) return DEFAULT_USER_SETTINGS;

  return normalizeUserSettings(mapRowToSettings(data as unknown as UserSettingsRow));
}

export async function upsertUserSettings(
  supabase: SupabaseServerClient,
  userId: string,
  update: UserSettingsUpdate
): Promise<UserSettings> {
  if (Object.keys(update).length === 0) {
    return fetchUserSettings(supabase, userId);
  }

  const mapped = mapSettingsPatchToRow(update);
  const { data, error } = await supabase
    .from("user_settings")
    .upsert(
      {
        user_id: userId,
        ...mapped,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select(
      [
        "display_name",
        "timezone",
        "week_start",
        "theme",
        "reduced_motion",
        "haptic_feedback",
        "compact_mode",
        "show_inactive_tasks",
        "default_priority",
        "default_difficulty",
        "auto_archive_days",
        "intensity_light",
        "intensity_medium",
        "intensity_high",
        "intensity_peak",
        "daily_reminder_enabled",
        "daily_reminder_time",
        "missed_task_reminder",
        "weekly_summary",
        "streak_risk_alert",
      ].join(",")
    )
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return fetchUserSettings(supabase, userId);
  }

  return normalizeUserSettings(mapRowToSettings(data as unknown as UserSettingsRow));
}
