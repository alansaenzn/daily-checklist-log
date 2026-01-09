-- Goal Templates: Blueprint collections for momentum-focused task sets
-- These are independent from recurring task templates and act as a library
-- Users can "apply" a goal template to copy its tasks into their task_templates

CREATE TABLE goal_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Metadata
  name TEXT NOT NULL,
  description TEXT,
  focus_area TEXT NOT NULL, -- productivity, training, creative, health, etc.
  
  -- Track origin for future improvements (system vs user-created)
  created_by UUID, -- NULL for system templates, user_id for user-created
  is_system BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT goal_template_name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT goal_template_focus_not_empty CHECK (length(trim(focus_area)) > 0)
);

-- Individual tasks within a goal template
-- When a goal template is "applied", these become task_templates for the user
CREATE TABLE goal_template_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_template_id UUID NOT NULL REFERENCES goal_templates(id) ON DELETE CASCADE,
  
  -- Task details
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'General',
  
  -- Task properties
  is_optional BOOLEAN DEFAULT FALSE, -- Some tasks can be skipped
  estimated_duration_minutes INT, -- 5-15 min for momentum focus
  
  -- Order within template for consistent application
  display_order INT NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT goal_template_task_title_not_empty CHECK (length(trim(title)) > 0),
  CONSTRAINT goal_template_task_duration_reasonable CHECK (
    estimated_duration_minutes IS NULL 
    OR (estimated_duration_minutes > 0 AND estimated_duration_minutes <= 60)
  )
);

-- Indexes for common queries
CREATE INDEX idx_goal_templates_focus_area ON goal_templates(focus_area);
CREATE INDEX idx_goal_templates_is_system ON goal_templates(is_system);
CREATE INDEX idx_goal_template_tasks_template_id ON goal_template_tasks(goal_template_id);
CREATE INDEX idx_goal_template_tasks_display_order ON goal_template_tasks(goal_template_id, display_order);

-- Add column to track which goal template was applied (for reference, not foreign key)
-- This helps users understand where their tasks came from
ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS goal_template_id UUID;
ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS applied_from_template_name TEXT;

-- Comment for documentation
COMMENT ON TABLE goal_templates IS 'Template collections that users can apply to quickly populate their daily tasks. Independent from recurring task_templates.';
COMMENT ON TABLE goal_template_tasks IS 'Individual tasks within a goal template. When template is applied, these are copied to task_templates.';
COMMENT ON COLUMN goal_template_tasks.is_optional IS 'If true, user can skip this task when applying the template without guilt.';
COMMENT ON COLUMN task_templates.goal_template_id IS 'Reference to the goal template this task was created from (for UX context).';
