-- Add  organization fields to task_templates
-- All fields are optional to maintain backward compatibility

ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS due_time TIME;
ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS list_name TEXT;
ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS details TEXT;

-- Add URL validation constraint
ALTER TABLE task_templates ADD CONSTRAINT task_templates_url_format 
  CHECK (url IS NULL OR url ~* '^https?://');

-- Indexes for queries by due date and list
CREATE INDEX IF NOT EXISTS idx_task_templates_due_date ON task_templates(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_templates_list_name ON task_templates(list_name) WHERE list_name IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN task_templates.notes IS 'Optional notes/description for the task (similar to Apple Reminders)';
COMMENT ON COLUMN task_templates.url IS 'Optional URL associated with the task';
COMMENT ON COLUMN task_templates.due_date IS 'Optional due date for the task (YYYY-MM-DD)';
COMMENT ON COLUMN task_templates.due_time IS 'Optional due time for the task (HH:MM:SS)';
COMMENT ON COLUMN task_templates.list_name IS 'Optional list/project name for organizing tasks';
COMMENT ON COLUMN task_templates.details IS 'Optional additional details or context';
