/**
 * Add category field to projects table
 * 
 * Allows projects to be organized by categories similar to tasks
 */

-- Add category column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS category TEXT;

-- Create index for category lookups (useful for filtering)
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category) WHERE category IS NOT NULL;

-- Add a check constraint to ensure category is not empty if provided
ALTER TABLE projects ADD CONSTRAINT projects_category_check 
  CHECK (category IS NULL OR char_length(category) > 0);

-- Comments
COMMENT ON COLUMN projects.category IS 'Optional category for organizing projects (e.g., Work, Personal, Fitness)';
