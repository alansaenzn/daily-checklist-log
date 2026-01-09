-- Add priority field to task_templates table
-- Apple Reminders-style priority levels: none, low, medium, high
-- All fields are optional to maintain backward compatibility

-- Create enum type for priority if it doesn't exist
CREATE TYPE task_priority AS ENUM ('none', 'low', 'medium', 'high');

-- Add priority column with default 'none'
ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS priority task_priority DEFAULT 'none';

-- Create index for priority queries
CREATE INDEX IF NOT EXISTS idx_task_templates_priority ON task_templates(priority) WHERE priority != 'none';

-- Comment for documentation
COMMENT ON COLUMN task_templates.priority IS 'Apple Reminders-style priority level (none, low, medium, high)';
