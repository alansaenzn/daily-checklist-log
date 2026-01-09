/**
 * Create projects table
 * 
 * Projects (Lists) provide contextual organization for tasks.
 * Users can group tasks into projects for better organization.
 */

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT projects_name_check CHECK (char_length(name) > 0 AND char_length(name) <= 100)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Add project_id to task_templates (if not exists)
ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Create index for project_id lookups
CREATE INDEX IF NOT EXISTS idx_task_templates_project_id ON task_templates(project_id) WHERE project_id IS NOT NULL;

-- Comments
COMMENT ON TABLE projects IS 'User-created projects/lists for organizing tasks';
COMMENT ON COLUMN projects.name IS 'Display name of the project';
COMMENT ON COLUMN task_templates.project_id IS 'Optional reference to a project for task organization';
