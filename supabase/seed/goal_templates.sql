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

-- Get the ID we just inserted (or if it existed)
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

---

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

---

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
    ('Brainstorm ideas', '5-10 ideas on paper', 'Creative', false, 5, 0),
    ('Sketch or create', '10-15 min of unstructured creation', 'Creative', false, 15, 1),
    ('Refine one piece', 'Polish something you started', 'Creative', true, 10, 2),
    ('Get inspired', 'Look at inspiring work in your field', 'Creative', true, 5, 3),
    ('Share your work', 'Post or send your creation', 'Creative', true, 5, 4)
) AS tasks(title, description, category, is_optional, estimated_duration_minutes, display_order)
CROSS JOIN template
WHERE NOT EXISTS (
  SELECT 1 FROM goal_template_tasks 
  WHERE goal_templates.id = template.id AND title = 'Brainstorm ideas'
);

---

-- HEALTH TEMPLATE
INSERT INTO goal_templates (name, description, focus_area, is_system)
VALUES (
  'Daily Wellness',
  'Small health wins for consistent wellbeing',
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
    ('Drink water', '8 oz when you wake up', 'Health', false, 2, 0),
    ('Move your body', 'Walk, stretch, or quick workout', 'Health', false, 10, 1),
    ('Healthy meal', 'Eat something nutritious', 'Health', false, 15, 2),
    ('Meditation or breathwork', '5 minutes of calm', 'Health', true, 5, 3),
    ('Get outside', 'Fresh air and sunlight', 'Health', true, 10, 4)
) AS tasks(title, description, category, is_optional, estimated_duration_minutes, display_order)
CROSS JOIN template
WHERE NOT EXISTS (
  SELECT 1 FROM goal_template_tasks 
  WHERE goal_templates.id = template.id AND title = 'Drink water'
);

---

-- MINDFULNESS TEMPLATE
INSERT INTO goal_templates (name, description, focus_area, is_system)
VALUES (
  'Mindful Morning',
  'Start your day with intention and calm',
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
    ('Mindful awakening', 'No phone for 5 min after waking', 'Mindfulness', false, 5, 0),
    ('Gratitude practice', 'Write 3 things you''re grateful for', 'Mindfulness', false, 3, 1),
    ('Morning meditation', 'Sit quietly for 5-10 minutes', 'Mindfulness', false, 10, 2),
    ('Set intentions', 'What do you want to focus on today?', 'Mindfulness', false, 3, 3),
    ('Journaling', 'Reflect on feelings and goals', 'Mindfulness', true, 5, 4)
) AS tasks(title, description, category, is_optional, estimated_duration_minutes, display_order)
CROSS JOIN template
WHERE NOT EXISTS (
  SELECT 1 FROM goal_template_tasks 
  WHERE goal_templates.id = template.id AND title = 'Mindful awakening'
);
