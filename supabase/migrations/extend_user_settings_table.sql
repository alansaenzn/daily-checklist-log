-- ============================================================================
-- User Settings: Extended profile, preferences, task behavior, and notifications
-- ============================================================================

ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS timezone text,
  ADD COLUMN IF NOT EXISTS week_start text NOT NULL DEFAULT 'monday',
  ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS reduced_motion boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS haptic_feedback boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS compact_mode boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_inactive_tasks boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS default_priority text NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS default_difficulty int NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS auto_archive_days int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS intensity_light int NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS intensity_medium int NOT NULL DEFAULT 6,
  ADD COLUMN IF NOT EXISTS intensity_high int NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS intensity_peak int NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS daily_reminder_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS daily_reminder_time time,
  ADD COLUMN IF NOT EXISTS missed_task_reminder boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS weekly_summary boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS streak_risk_alert boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS focus_timer_minutes int NOT NULL DEFAULT 25;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_settings_week_start_valid'
  ) THEN
    ALTER TABLE public.user_settings
      ADD CONSTRAINT user_settings_week_start_valid
      CHECK (week_start IN ('sunday', 'monday'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_settings_theme_valid'
  ) THEN
    ALTER TABLE public.user_settings
      ADD CONSTRAINT user_settings_theme_valid
      CHECK (theme IN ('system', 'light', 'dark'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_settings_default_priority_valid'
  ) THEN
    ALTER TABLE public.user_settings
      ADD CONSTRAINT user_settings_default_priority_valid
      CHECK (default_priority IN ('low', 'medium', 'high'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_settings_default_difficulty_range'
  ) THEN
    ALTER TABLE public.user_settings
      ADD CONSTRAINT user_settings_default_difficulty_range
      CHECK (default_difficulty >= 1 AND default_difficulty <= 5);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_settings_auto_archive_non_negative'
  ) THEN
    ALTER TABLE public.user_settings
      ADD CONSTRAINT user_settings_auto_archive_non_negative
      CHECK (auto_archive_days >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_settings_intensity_ascending'
  ) THEN
    ALTER TABLE public.user_settings
      ADD CONSTRAINT user_settings_intensity_ascending
      CHECK (
        intensity_light < intensity_medium
        AND intensity_medium < intensity_high
        AND intensity_high < intensity_peak
      );
  END IF;
END $$;

COMMENT ON COLUMN public.user_settings.display_name IS 'User-facing name for settings/profile display.';
COMMENT ON COLUMN public.user_settings.week_start IS 'Start of week preference (sunday or monday).';
COMMENT ON COLUMN public.user_settings.theme IS 'Theme preference: system, light, or dark.';
COMMENT ON COLUMN public.user_settings.compact_mode IS 'Dense layout preference for task rows.';
COMMENT ON COLUMN public.user_settings.default_priority IS 'Default task priority for new tasks.';
COMMENT ON COLUMN public.user_settings.default_difficulty IS 'Default task difficulty (1-5) for new tasks.';
COMMENT ON COLUMN public.user_settings.auto_archive_days IS 'Days after completion to auto-archive tasks (0 = never).';
COMMENT ON COLUMN public.user_settings.intensity_light IS 'Min tasks for light activity intensity.';
COMMENT ON COLUMN public.user_settings.intensity_medium IS 'Min tasks for medium activity intensity.';
COMMENT ON COLUMN public.user_settings.intensity_high IS 'Min tasks for high activity intensity.';
COMMENT ON COLUMN public.user_settings.intensity_peak IS 'Min tasks for peak activity intensity.';
COMMENT ON COLUMN public.user_settings.focus_timer_minutes IS 'Default duration (minutes) for focus timer when starting via play button.';
