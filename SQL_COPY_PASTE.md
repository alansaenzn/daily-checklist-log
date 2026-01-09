# Supabase SQL: Ready to Copy-Paste

## Instructions

1. Go to: https://supabase.com/dashboard/project/eomhgxxtcwnoniblvkod/sql/new
2. Copy **entire content** of the SQL below
3. Paste into the SQL editor
4. Click **Run**

---

## Part 1: Create Schema Tables

Copy and run this first:

```sql
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
```

**Expected Output**: `Query executed successfully`

---

## Part 2: Seed Example Data

Then, create a **new query** and copy-paste this:

```sql
-- Seed Goal Templates with example data
-- These are system templates that all users can see and apply

-- PRODUCTIVITY TEMPLATE
INSERT INTO goal_templates (name, description, focus_area, is_system)
VALUES (
  'Deep Work Session',
  'Focused productivity tasks to minimize distractions and maximize output',
  'Productivity',
  true
)
ON CONFLICT DO NOTHING;

WITH template AS (
  SELECT id FROM goal_templates 
  WHERE name = 'Deep Work Session' 
  LIMIT 1
)
INSERT INTO goal_template_tasks (goal_template_id, title, description, category, is_optional, estimated_duration_minutes, display_order)
SELECT 
  template.id,
  title,
  description,
  category,
  is_optional,
  estimated_duration_minutes,
  display_order
FROM (
  VALUES
    ('Prepare workspace', 'Clear desk, close unnecessary tabs', 'Productivity', false, 5, 0),
    ('Set timer for focus block', '25-min Pomodoro session', 'Productivity', false, 1, 1),
    ('Deep work sprint', 'Uninterrupted focus time', 'Productivity', false, 25, 2),
    ('Quick break', 'Walk, hydrate, rest eyes', 'Health', false, 5, 3),
    ('Reflect on progress', 'Note what you accomplished', 'Productivity', true, 3, 4)
) AS tasks(title, description, category, is_optional, estimated_duration_minutes, display_order)
CROSS JOIN template
WHERE NOT EXISTS (
  SELECT 1 FROM goal_template_tasks 
  WHERE goal_templates.id = template.id AND title = 'Prepare workspace'
);

-- TRAINING TEMPLATE
INSERT INTO goal_templates (name, description, focus_area, is_system)
VALUES (
  'Skill Building',
  'Quick learning tasks to build momentum on new skills',
  'Training',
  true
)
ON CONFLICT DO NOTHING;

WITH template AS (
  SELECT id FROM goal_templates 
  WHERE name = 'Skill Building' 
  LIMIT 1
)
INSERT INTO goal_template_tasks (goal_template_id, title, description, category, is_optional, estimated_duration_minutes, display_order)
SELECT 
  template.id,
  title,
  description,
  category,
  is_optional,
  estimated_duration_minutes,
  display_order
FROM (
  VALUES
    ('Review learning goals', 'What are you working on?', 'Training', false, 2, 0),
    ('Focused study session', '15 minutes of deliberate practice', 'Training', false, 15, 1),
    ('Practice exercises', 'Apply what you learned', 'Training', false, 10, 2),
    ('Read one chapter/article', 'Expand knowledge', 'Training', true, 10, 3),
    ('Teach someone else', 'Explain a concept', 'Training', true, 5, 4)
) AS tasks(title, description, category, is_optional, estimated_duration_minutes, display_order)
CROSS JOIN template
WHERE NOT EXISTS (
  SELECT 1 FROM goal_template_tasks 
  WHERE goal_templates.id = template.id AND title = 'Review learning goals'
);

-- CREATIVE TEMPLATE
INSERT INTO goal_templates (name, description, focus_area, is_system)
VALUES (
  'Creative Flow',
  'Low-pressure tasks to spark creativity and build a habit',
  'Creative',
  true
)
ON CONFLICT DO NOTHING;

WITH template AS (
  SELECT id FROM goal_templates 
  WHERE name = 'Creative Flow' 
  LIMIT 1
)
INSERT INTO goal_template_tasks (goal_template_id, title, description, category, is_optional, estimated_duration_minutes, display_order)
SELECT 
  template.id,
  title,
  description,
  category,
  is_optional,
  estimated_duration_minutes,
  display_order
FROM (
  VALUES
    ('Brainstorm ideas', 'Free writing or mind mapping', 'Creative', false, 5, 0),
    ('Create something', 'Make without judgment', 'Creative', false, 20, 1),
    ('Refine your work', 'Polish or iterate', 'Creative', true, 10, 2),
    ('Seek inspiration', 'Look at inspiring work', 'Creative', true, 5, 3),
    ('Share your progress', 'Show someone your work', 'Creative', true, 5, 4)
) AS tasks(title, description, category, is_optional, estimated_duration_minutes, display_order)
CROSS JOIN template
WHERE NOT EXISTS (
  SELECT 1 FROM goal_template_tasks 
  WHERE goal_templates.id = template.id AND title = 'Brainstorm ideas'
);

-- WELLNESS TEMPLATE
INSERT INTO goal_templates (name, description, focus_area, is_system)
VALUES (
  'Daily Wellness',
  'Quick health and wellness micro-habits',
  'Health',
  true
)
ON CONFLICT DO NOTHING;

WITH template AS (
  SELECT id FROM goal_templates 
  WHERE name = 'Daily Wellness' 
  LIMIT 1
)
INSERT INTO goal_template_tasks (goal_template_id, title, description, category, is_optional, estimated_duration_minutes, display_order)
SELECT 
  template.id,
  title,
  description,
  category,
  is_optional,
  estimated_duration_minutes,
  display_order
FROM (
  VALUES
    ('Drink water', '8 oz of water', 'Health', false, 2, 0),
    ('Move your body', 'Walk, stretch, or exercise', 'Health', false, 10, 1),
    ('Eat something nutritious', 'Healthy snack or meal', 'Health', false, 10, 2),
    ('Meditation or breathing', '5 minutes of mindfulness', 'Health', true, 5, 3),
    ('Get outside', 'Fresh air and sunlight', 'Health', true, 10, 4)
) AS tasks(title, description, category, is_optional, estimated_duration_minutes, display_order)
CROSS JOIN template
WHERE NOT EXISTS (
  SELECT 1 FROM goal_template_tasks 
  WHERE goal_templates.id = template.id AND title = 'Drink water'
);

-- MINDFULNESS TEMPLATE
INSERT INTO goal_templates (name, description, focus_area, is_system)
VALUES (
  'Mindful Morning',
  'Start your day with intention and presence',
  'Mindfulness',
  true
)
ON CONFLICT DO NOTHING;

WITH template AS (
  SELECT id FROM goal_templates 
  WHERE name = 'Mindful Morning' 
  LIMIT 1
)
INSERT INTO goal_template_tasks (goal_template_id, title, description, category, is_optional, estimated_duration_minutes, display_order)
SELECT 
  template.id,
  title,
  description,
  category,
  is_optional,
  estimated_duration_minutes,
  display_order
FROM (
  VALUES
    ('Mindful wake-up', 'Slowly wake without rushing', 'Mindfulness', false, 5, 0),
    ('Gratitude practice', 'Name 3 things you appreciate', 'Mindfulness', false, 3, 1),
    ('Meditation or stretching', 'Center yourself', 'Mindfulness', true, 10, 2),
    ('Set daily intentions', 'What matters today?', 'Mindfulness', false, 5, 3),
    ('Journal reflection', 'Write thoughts and feelings', 'Mindfulness', true, 10, 4)
) AS tasks(title, description, category, is_optional, estimated_duration_minutes, display_order)
CROSS JOIN template
WHERE NOT EXISTS (
  SELECT 1 FROM goal_template_tasks 
  WHERE goal_templates.id = template.id AND title = 'Mindful wake-up'
);
```

**Expected Output**: `Query executed successfully`

---

## Part 3: Set Up Row Level Security

Then, create another **new query** and copy-paste this:

```sql
-- ============================================================================
-- Enable RLS and create policies for goal_templates and goal_template_tasks
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
```

**Expected Output**: `Query executed successfully`

---

## Verification

After all 3 queries run successfully:

```bash
# Check if setup is complete
node scripts/check-goal-templates.js

# Restart dev server
npm run dev

# Visit in browser
http://localhost:3000/templates
```

You should see:
- ✅ 5 goal template cards
- ✅ No console errors
- ✅ Can click "Preview" and "Apply"
- ✅ Applied tasks appear in /tasks

---

## Troubleshooting

| If you see | Do this |
|-----------|--------|
| `Query executed successfully` ✅ | Move to next query |
| Error about table already exists | That's OK, means it was already created |
| Permission denied / 403 error | Make sure Part 3 (RLS policies) is run |
| Tables exist but page shows empty | Run Part 3 again |

---

**Total Time: ~5 minutes**

Go to [GOAL_TEMPLATES_DEPLOY.md](GOAL_TEMPLATES_DEPLOY.md) for more detailed instructions.
