# Goal Templates - Quick Reference Card

## 🚀 Quick Start (5 minutes)

```bash
# 1. Run migrations
supabase migration up

# 2. Seed example data
supabase seed run

# 3. Start app
npm run dev

# 4. Visit
http://localhost:3000/templates
```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `src/app/templates/page.tsx` | Main templates page |
| `src/components/GoalTemplatesListView.tsx` | Master list component |
| `src/app/actions/goal-templates.ts` | Server actions |
| `supabase/migrations/create_goal_templates.sql` | Database schema |
| `supabase/seed/goal_templates.sql` | Example data |

## 🎯 Core Concepts

**Goal Template**: Blueprint for a set of small, achievable tasks
**Template Task**: Individual task within a template
**Apply**: Copy template tasks to user's task_templates as editable items

## 🔧 Server Actions

```typescript
// Fetch all templates (with optional focus filter)
await getGoalTemplates("Productivity");

// Fetch template with tasks (for preview)
await getGoalTemplateWithTasks(templateId);

// Apply template to current user
await applyGoalTemplate(templateId);
// Returns: { success: true, templatesCreated: 5, templateName: "..." }
```

## 📦 Data Models

```typescript
interface GoalTemplate {
  id: string;
  name: string;
  description: string | null;
  focus_area: string; // "Productivity", "Training", "Creative", "Health", "Mindfulness", "Social"
  is_system: boolean;
  created_by: string | null; // null for system templates
}

interface GoalTemplateTask {
  id: string;
  goal_template_id: string;
  title: string;
  category: string;
  is_optional: boolean;
  estimated_duration_minutes: number | null;
  display_order: number;
}
```

## 🎨 Components

| Component | Props | Usage |
|-----------|-------|-------|
| `GoalTemplateCard` | template, taskCount, onPreview, onApply | Individual card |
| `GoalTemplatePreview` | template, onClose, onApply, isApplying | Modal preview |
| `GoalTemplatesListView` | templates | Main page view |

## 🗄️ Database

**Two new tables**:
- `goal_templates` - Blueprint collections
- `goal_template_tasks` - Tasks within templates

**Extend existing**:
- `task_templates.goal_template_id` (optional reference)
- `task_templates.applied_from_template_name` (for UX context)

**Cascading**: Delete template → deletes all its tasks automatically

## 💡 Key Features

✅ 5 system templates pre-seeded
✅ Filter by focus area
✅ Preview modal before applying
✅ Bulk task creation
✅ Error handling with toast notifications
✅ Mobile-responsive design
✅ No external UI libraries needed

## 🔒 Authentication & Permissions

- All endpoints require authentication
- Users see system templates (`is_system: true`)
- Users see their own created templates
- No permission issues with applying templates

## 🛠️ Common Tasks

### Add a New System Template

1. Edit `supabase/seed/goal_templates.sql`
2. Add INSERT for `goal_templates`
3. Add INSERTs for `goal_template_tasks`
4. Run seed: `supabase seed run`

### Change Task Default Type

In `src/app/actions/goal-templates.ts`, `applyGoalTemplate()`:
```typescript
task_type: "recurring" as const,  // ← Change to "one_off"
```

### Customize Colors

In components, change Tailwind classes:
```typescript
className="bg-blue-600"  // ← Change color here
```

### Add Validation

In `src/app/actions/goal-templates.ts`:
```typescript
if (tasks.length > 10) {
  throw new Error("Max 10 tasks per template");
}
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Not authenticated" | User not logged in |
| "Unauthorized" | User accessing other user's template |
| No templates visible | Run seed: `supabase seed run` |
| Tasks not appearing | Check migration ran successfully |
| Style issues | Ensure Tailwind CSS is configured |

## 📊 Example Flow

```
User visits /templates
  ↓
[Server] Fetch templates
  ↓
[Page] Render GoalTemplatesListView
  ↓
User clicks Preview
  ↓
[Client] Show GoalTemplatePreview modal
  ↓
User clicks Apply
  ↓
[Server] applyGoalTemplate() creates task_templates
  ↓
[Client] Toast notification + close modal
  ↓
Tasks appear in daily checklist (recurring, active)
  ↓
User can edit/delete tasks independently
```

## 🚀 Deploy Checklist

- [ ] Run migrations: `supabase migration up`
- [ ] Seed data: `supabase seed run`
- [ ] Test `/templates` page loads
- [ ] Test apply flow end-to-end
- [ ] Check tasks appear in daily checklist
- [ ] Add navigation link to `/templates`
- [ ] Test on mobile device
- [ ] Deploy to production

## 📚 Documentation

- **Full Reference**: `GOAL_TEMPLATES_DOCUMENTATION.md`
- **Setup Guide**: `GOAL_TEMPLATES_IMPLEMENTATION_GUIDE.md`
- **Delivery Summary**: `GOAL_TEMPLATES_DELIVERY.md`
- **This Card**: `GOAL_TEMPLATES_QUICK_REFERENCE.md`

## 🔗 Related

- **Task System**: `src/lib/task-types.ts`
- **Existing Actions**: `src/app/actions/tasks.ts`
- **Daily Checklist**: `src/app/today/page.tsx`
- **Task Templates Table**: `task_templates` in Supabase

## 💬 Focus Areas (Built-in)

- Productivity
- Training
- Creative
- Health
- Mindfulness
- Social

## ⏱️ Task Duration Guide

- **5 min**: Drink water, stretch, prep workspace
- **10 min**: Meditation, read article, sketch
- **15 min**: Deep work sprint, practice session
- **20+ min**: Not recommended (breaks momentum focus)

---

**Ready to deploy?** Follow Quick Start above. Need details? See full documentation files.

Last Updated: January 2026
