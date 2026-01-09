# Quick Reference: New App Architecture

## 🚀 Four Core Sections

```
┌─────────────────────────────────────────────┐
│            CHECKLIST LOG                    │
├──────┬──────────┬───────────┬───────────────┤
│ 📈   │    ✓     │     ⭐    │       📊      │
│ DASH │  ACTIVE  │ TEMPLATES │    ARCHIVE    │
└──────┴──────────┴───────────┴───────────────┘
```

---

## 📈 Dashboard (`/dashboard`)
**Reflection & Direction**

```
What you see:
├── Momentum Snapshot (monthly heatmap)
├── System Health (consistency visual)
└── "Explore Templates" button

What you do:
└── Read and reflect

When to visit:
→ Check your momentum
→ See your progress
→ Get inspired to explore
```

---

## ✓ Active (`/active`)
**Execution Surface** (Only place to execute tasks)

```
What you see:
├── Task list (your active templates)
├── Checkboxes (mark complete)
├── Task form (add new)
└── Categories (organized grouping)

What you do:
├── Check off completed tasks
├── Create new tasks
├── Edit task details
└── Manage templates

When to visit:
→ Multiple times per day
→ To build momentum
→ To check off progress
```

---

## ⭐ Templates (`/templates`)
**Design & Management**

```
Segmented Control:

┌─────────────────────┬─────────────────────┐
│   RECOMMENDED       │    MY TEMPLATES     │
└─────────────────────┴─────────────────────┘

Recommended Tab:
├── System templates (pre-built)
├── Browse by focus area
├── Preview before apply
└── No editing

My Templates Tab:
├── Your custom templates
├── Create new
├── Edit existing
├── Duplicate
├── Delete
└── Filter by focus

When to visit:
→ Discover momentum templates
→ Design task blueprints
→ Create new systems
→ Apply recommendations
```

---

## 📊 Archive (`/archive`)
**Memory & Proof** (Historical record)

```
What you see:
├── Calendar with completion counts
├── Daily view (completed tasks by day)
├── Weekly view (weekly heatmap)
├── Monthly view (monthly heatmap)
└── Yearly view (yearly heatmap)

What you do:
└── Read and reflect (purely view-only)

When to visit:
→ Review past accomplishments
→ Analyze patterns
→ Celebrate progress
→ Understand your history
```

---

## 🎯 User Flows

### New User
```
1. Home → Dashboard
2. See momentum snapshot
3. Click "Explore Templates"
4. Go to Templates → Recommended tab
5. Browse system templates
6. Preview a template
7. Apply it → creates tasks
8. Go to Active
9. Check off tasks for today
```

### Returning User (Daily)
```
1. Open → Active (bottom nav)
2. Check off today's tasks
3. (Optional) Dashboard → see progress
4. (Optional) Archive → reflect on history
5. (Optional) Templates → explore new ideas
```

### Power User (Weekly Planning)
```
1. Templates → My Templates tab
2. Create or edit templates
3. Plan upcoming projects
4. Active → manage current tasks
5. Dashboard → monitor momentum
6. Archive → analyze patterns
```

---

## 🔄 Navigation (Bottom Bar)

```
Current Structure (All tabs visible):
┌──────┬────────┬──────────┬─────────┐
│ 📈   │   ✓    │    ⭐    │   📊    │
│DASH  │ ACTIVE │TEMPLATES │ ARCHIVE │
└──────┴────────┴──────────┴─────────┘
```

---

## 📱 Mobile Optimized
- 4 tabs fit perfectly on mobile bottom nav
- Each tab has clear icon and label
- Tab-based navigation natural for phones
- No nested tabs within pages
- Swipe or tap between sections

---

## 🎨 Visual Design

### Dashboard
```
┌─────────────────────────────────┐
│ Reflection                      │
│                                 │
│ Your Momentum                   │
│ ─────────────────────────────   │
│ [Heatmap Calendar]              │
│                                 │
│ System Health                   │
│ [Health visualization]          │
│                                 │
│ [Explore Templates →]           │
└─────────────────────────────────┘
```

### Active
```
┌─────────────────────────────────┐
│ Execution                       │
│                                 │
│ Active                          │
│ [Add Task Form]                 │
│                                 │
│ [Category 1]                    │
│ ☐ Task 1                        │
│ ☐ Task 2                        │
│                                 │
│ [Category 2]                    │
│ ☐ Task 3                        │
│ ☐ Task 4                        │
└─────────────────────────────────┘
```

### Templates
```
┌─────────────────────────────────┐
│ Design                          │
│                                 │
│ Templates                       │
│ [Recommended] [My Templates]    │
│                                 │
│ Filter: [All] [Health] [Work]   │
│                                 │
│ [Template Card 1]               │
│ [Template Card 2]               │
│ [+ Create Template] (My only)   │
└─────────────────────────────────┘
```

### Archive
```
┌─────────────────────────────────┐
│ Memory                          │
│                                 │
│ Archive                         │
│ [Daily] [Weekly] [Monthly]      │
│              [Yearly]           │
│                                 │
│ [Calendar/Heatmap View]         │
│                                 │
│ Completed Tasks:                │
│ • Jan 1: 5 completed            │
│ • Jan 2: 3 completed            │
│                                 │
└─────────────────────────────────┘
```

---

## 💾 Data & State

### Server-Side (SSR)
- Dashboard: Fetches current month data
- Active: Fetches user's task templates
- Templates: Fetches all templates (system + user)
- Archive: Fetches full year data

### Client-Side (Interactive)
- Dashboard: Read-only display
- Active: State for task management, checkboxes
- Templates: State for filtering, segmented control, preview modal
- Archive: State for view switching

---

## 🔐 Read-Only vs. Execution

| Section | Read-Only | Can Execute | Can Create | Can Edit | Can Delete |
|---------|-----------|-------------|-----------|----------|-----------|
| Dashboard | ✅ | ❌ | ❌ | ❌ | ❌ |
| Active | ❌ | ✅ | ✅ | ✅ | ✅ |
| Templates (Rec) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Templates (My) | ❌ | ❌ | ✅ | ✅ | ✅ |
| Archive | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 🎓 Teaching Mental Model

### "What's This Page For?"

**Dashboard:**
> "I want to understand my momentum and see my progress at a glance"

**Active:**
> "I want to do the work. What tasks should I check off right now?"

**Templates:**
> "I want to design new task systems or explore recommended ones"

**Archive:**
> "I want to look back at what I've accomplished"

---

## ⚙️ Setup & Configuration

### No new configuration needed!
- Uses existing database
- Uses existing authentication
- Uses existing components
- No new environment variables
- No new dependencies

### Just deploy and go!

---

## 🚀 Next Steps

1. **Test Navigation:** Click between all 4 tabs
2. **Test Flows:** Follow example user journeys above
3. **Test Features:** Verify all operations work
4. **Monitor Usage:** Track which tabs users visit
5. **Gather Feedback:** Ask users about clarity

---

## 📞 Support

- Dashboard issues → Check heatmap data fetch
- Active issues → Check task template loading
- Templates issues → Check segmented control state
- Archive issues → Check calendar view switcher

All issues likely stem from data fetching or component integration, not new code.

---

## ✨ Key Features Preserved

✅ Task templates (system + user)
✅ Task completion tracking
✅ Heatmap visualization
✅ Category organization
✅ Focus area filtering
✅ Template application
✅ Template creation
✅ Dark mode
✅ Responsive design
✅ Mobile optimization

**Nothing was removed. Only reorganized for clarity.**
