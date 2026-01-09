-- Add difficulty (1-5) to task templates
-- Used for analytics and reflection metrics

ALTER TABLE task_templates
  ADD COLUMN IF NOT EXISTS difficulty integer;

ALTER TABLE task_templates
  ALTER COLUMN difficulty SET DEFAULT 3;

ALTER TABLE task_templates
  ADD CONSTRAINT task_templates_difficulty_range
  CHECK (difficulty IS NULL OR (difficulty >= 1 AND difficulty <= 5));
