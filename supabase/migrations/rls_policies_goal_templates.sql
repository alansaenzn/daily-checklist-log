-- ============================================================================
-- Goal Templates: Row Level Security (RLS) Policies
-- ============================================================================
-- Copy this ENTIRE SQL and run in Supabase Dashboard SQL Editor
-- This allows users to access templates they should be able to see
-- ============================================================================

-- Enable RLS on goal_templates table
ALTER TABLE goal_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can select system templates or their own templates
CREATE POLICY "Users can select system and own templates"
  ON goal_templates
  FOR SELECT
  USING (
    is_system = true 
    OR auth.uid() = created_by
  );

-- Allow authenticated users to insert their own templates (future feature)
CREATE POLICY "Users can insert their own templates"
  ON goal_templates
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Allow users to update their own templates
CREATE POLICY "Users can update their own templates"
  ON goal_templates
  FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- ============================================================================

-- Enable RLS on goal_template_tasks table
ALTER TABLE goal_template_tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can select tasks from accessible templates
-- A user can see tasks if they can see the parent template
CREATE POLICY "Users can select tasks from accessible templates"
  ON goal_template_tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM goal_templates
      WHERE goal_templates.id = goal_template_tasks.goal_template_id
      AND (
        goal_templates.is_system = true 
        OR goal_templates.created_by = auth.uid()
      )
    )
  );

-- ============================================================================
-- AFTER RUNNING THIS SQL:
-- 1. All authenticated users can see system templates (is_system = true)
-- 2. Users can only see their own templates (created_by = auth.uid())
-- 3. Users can only see tasks from templates they can access
-- 4. The existing queries in the app will work correctly
-- ============================================================================
