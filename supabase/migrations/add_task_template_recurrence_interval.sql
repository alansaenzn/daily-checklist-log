-- Add recurrence interval (days) for recurring task templates

ALTER TABLE task_templates
ADD COLUMN IF NOT EXISTS recurrence_interval_days INTEGER DEFAULT 1;

ALTER TABLE task_templates
ADD CONSTRAINT task_templates_recurrence_interval_days_positive
CHECK (recurrence_interval_days IS NULL OR recurrence_interval_days > 0);

COMMENT ON COLUMN task_templates.recurrence_interval_days IS 'Recurring tasks: number of days between occurrences (default 1)';
