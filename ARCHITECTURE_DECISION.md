# Architecture Decision Record: Navigation Refactoring

## Status: COMPLETED ✅

## Context
The app had a confusing information architecture with overlapping concerns:
- Multiple task execution surfaces (`/today`, `/tasks`)
- Templates mixed with dashboards and statistics (`/templates` had 3 tabs)
- History page was separate from other views
- No clear mental model for user actions

## Decision
Implement a four-section, purpose-driven information architecture:

### 1. **Dashboard** (Reflection & Direction)
- **What it is:** Your progress dashboard
- **Read-only:** Yes
- **Contains:** Momentum snapshot, system health, CTA to explore
- **When to visit:** To understand your momentum and progress

### 2. **Active** (Execution Surface)
- **What it is:** Where you do the work
- **Execute:** Checkboxes, task creation/editing
- **Contains:** Daily task list, templates management
- **When to visit:** Multiple times per day to check off progress

### 3. **Templates** (Design & Management)
- **What it is:** Browse and create task blueprints
- **Modes:** Recommended (system) or My Templates (user)
- **Recommended:** Apply-focused, read-only, pre-built
- **My Templates:** Create, edit, duplicate, delete
- **When to visit:** Plan new projects, explore momentum ideas

### 4. **Archive** (Memory & Proof)
- **What it is:** Your historical record
- **Read-only:** Completely
- **Contains:** Heatmaps, completed tasks, statistics
- **When to visit:** Reflect on progress, see patterns

---

## Key Principles Applied

### 1. **Separation of Concerns**
Each page has a single, clear purpose. No mixing of reflection/execution/management.

### 2. **Mental Model Alignment**
The four sections align with natural user questions:
- "Where am I?" → Dashboard
- "What do I do?" → Active
- "What should I do?" → Templates
- "Where have I been?" → Archive

### 3. **Mode Consistency**
- **Read-only sections:** Dashboard, Archive (no mutations)
- **Execution sections:** Active (checkboxes, task management)
- **Management sections:** Templates → My Templates tab only

### 4. **Information Architecture**
- No nested tabs within pages
- No redundant UI patterns
- Clear navigation flow
- 4-item bottom nav (optimal for mobile)

---

## Comparison: Before vs. After

### Before
```
Navigation Chaos:
├── /today (just daily checklist)
├── /tasks (task management)
├── /templates (dashboard + browse + manage)
│   ├── Dashboard tab (stats, heatmap)
│   ├── My Plan tab (system templates)
│   └── Plans tab (user templates)
└── /history (calendar, heatmaps)

Problem: 
- Where do I execute? /today or /tasks?
- Where do I browse templates? /templates tabs
- Where do I see stats? /templates Dashboard tab
- Where is my history? /history but also /templates Dashboard
- What is the app's core purpose? Unclear
```

### After
```
Clear Architecture:
├── /dashboard (Momentum Snapshot + CTA)
│   └── Read-only reflection
├── /active (Task Execution)
│   └── Checkboxes, creation, management
├── /templates (Template Design)
│   ├── Recommended Tab (system, apply-only)
│   └── My Templates Tab (user, full CRUD)
└── /archive (Historical Record)
    └── Heatmaps, completed tasks, read-only

Benefits:
- Clear execution surface (/active)
- Clear design surface (/templates)
- Clear reflection surface (/dashboard)
- Clear memory surface (/archive)
```

---

## Implementation Details

### Component Reuse Strategy
- **No new UI components** - Reused existing cards, modals, heatmaps
- **New container:** `TemplatesView` wraps existing components with segmented control logic
- **Preserved logic:** All server-side data fetching and business logic unchanged

### Data Flow
1. **Server-side rendering** for initial data load (SSR)
2. **Client-side interactivity** for filtering, modals, state management
3. **No new database queries** - Reused existing aggregation functions

### Routing Structure
```
src/app/
├── dashboard/
│   └── page.tsx (new)
├── active/
│   └── page.tsx (new - mirrors /tasks)
├── templates/
│   └── page.tsx (refactored - now uses TemplatesView)
├── archive/
│   └── page.tsx (new - mirrors /history)
├── tasks/ (deprecated, can be deleted)
├── today/ (deprecated, can be deleted)
└── history/ (deprecated, can be deleted)
```

---

## Considerations

### ✅ What We Kept
- Existing visual style and components
- All backend logic and database queries
- User data and migrations
- Responsive design patterns
- Dark mode support

### ✅ What We Gained
- Clear mental model
- Non-overlapping concerns
- Reduced cognitive load
- Better mobile navigation (4 tabs fit bottom nav perfectly)
- Scalable architecture for future features

### ⚠️ What We Changed
- Navigation structure (4 main sections vs. previous 4 with mixed concerns)
- Page organization
- URL structure (but similar semantics)

### 🗑️ What We Can Remove
- `/tasks` folder (consolidated into `/active`)
- `/today` folder (consolidated into `/active`)
- `/history` folder (replaced by `/archive`)
- `GoalTemplatesListView` component (replaced by `TemplatesView`)

---

## Success Metrics

✅ **Navigation Clarity:** 4 focused sections, each with clear purpose  
✅ **Reduced Redundancy:** No duplicate functionality across pages  
✅ **Improved UX:** Clear user mental model  
✅ **Maintained Functionality:** All features preserved  
✅ **Code Quality:** No new dependencies, clean separation  
✅ **Compilation:** Zero errors, fully typed  

---

## Future Improvements

1. Delete unused routes after validation
2. Consider combining today/active into a unified daily view if needed
3. Add onboarding flow to guide new users
4. Analytics could be added to dashboard without violating separation
5. Archive could support date range selection

---

## Conclusion

The refactoring successfully reorganizes the app's information architecture around user intent and mental models. Each section now has a clear, non-overlapping purpose, making the app more intuitive and maintainable.
