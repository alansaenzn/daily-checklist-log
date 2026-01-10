-- ============================================================================
-- User Settings: Focus Timer Minutes
-- ============================================================================

ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS focus_timer_minutes int;

-- Set a sensible default for existing rows if NULL
UPDATE public.user_settings
SET focus_timer_minutes = 25
WHERE focus_timer_minutes IS NULL;

-- Optional: enforce NOT NULL + default for future inserts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attrdef d
    JOIN pg_class c ON c.oid = d.adrelid
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = d.adnum
    WHERE c.relname = 'user_settings'
      AND a.attname = 'focus_timer_minutes'
  ) THEN
    ALTER TABLE public.user_settings
      ALTER COLUMN focus_timer_minutes SET DEFAULT 25;
  END IF;
END $$;

ALTER TABLE public.user_settings
  ALTER COLUMN focus_timer_minutes SET NOT NULL;

COMMENT ON COLUMN public.user_settings.focus_timer_minutes IS 'Default duration (minutes) for focus timer when starting via play button.';
