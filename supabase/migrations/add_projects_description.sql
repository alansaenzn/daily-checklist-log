-- Add optional description to projects for inline editing
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN projects.description IS 'Optional description/notes for the project';
