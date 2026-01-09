# Navigation & Information Architecture Refactoring

## Overview
Successfully refactored the app from a task-centric, multi-page structure to a clear three-section information architecture with an execution surface.

## New Structure

### Navigation (Bottom Bar - 4 Tabs)
1. **Dashboard** `/dashboard` - Reflection & Direction
2. **Active** `/active` - Execution Surface  
3. **Templates** `/templates` - Design & Management
4. **Archive** `/archive` - Memory & Proof

---

## Section Details

### 1. Dashboard (`/dashboard`)
**Purpose:** Reflection & Direction  
**Read-only, high-level overview**

**Contains:**
- Momentum Snapshot: Monthly heatmap of completed tasks
- System Health: Visual representation of consistency
- Primary CTA: "Explore Templates"

**Characteristics:**
- No template browsing or management UI
- No checkboxes or execution elements
- Focuses on reflection and progress visualization
- Shows current month activity only

---

### 2. Active (`/active`)
**Purpose:** Execution Surface  
**The ONLY place to check off tasks**

**Contains:**
- Task management UI with checkboxes
- Task template creation and editing
- Task form for adding new tasks
- Tasks grouped by category

**Characteristics:**
- No analytics or templates
- Pure execution focus
- Can add, edit, and manage individual tasks
- Where daily momentum is actually built

**Replaces:** `/today` and `/tasks` (consolidated)

---

### 3. Templates (`/templates`)
**Purpose:** Design & Management  
**Unified templates page with segmented control**

**Segmented Control:**
- **Recommended Tab:** System templates (pre-built, apply-focused, read-only)
  - Browse curated momentum templates
  - Click to preview and apply
  - No editing or deletion
  - Filter by focus area
  
- **My Templates Tab:** User-created templates (editable)
  - Create new templates
  - Edit existing templates
  - Duplicate templates
  - Delete templates
  - Filter by focus area

**Features:**
- Same card UI and layout for both
- Focus area filtering (Productivity, Health, Creative, Mindfulness, etc.)
- Template preview modal
- Apply action opens preview
- Create template modal

**Merged from:** `/templates` "My Plan" + "Plans" tabs

---

### 4. Archive (`/archive`)
**Purpose:** Memory & Proof  
**Read-only view of completed tasks and activity history**

**Contains:**
- Calendar view with completed task counts
- Weekly heatmap
- Monthly heatmap  
- Yearly heatmap
- Completed tasks grouped by date
- View switcher for different time periods

**Characteristics:**
- Completely read-only
- No checkboxes or execution elements
- No creation or modification flows
- Pure historical record of accomplishments

**Replaces:** `/history`

---

## Removed Routes & Pages

### `/today`
- Consolidated into `/active`
- All execution moved to unified Active section

### `/tasks` 
- Consolidated into `/active`
- Task template management now in Active section

### `/history`
- Renamed to `/archive`
- Same functionality, read-only context

### Old `/templates` Dashboard Tab
- Removed "Dashboard" tab from GoalTemplatesListView
- Dashboard is now its own dedicated page

### Old `/templates` Tabs
- Removed "My Plan" and "Plans" separate tabs
- Now unified with segmented control in Templates page

---

## Component Updates

### New Components Created
1. **`TemplatesView`** - Unified templates page with segmented control
   - Props: `templates: GoalTemplate[]`
   - State: `activeSegment: "recommended" | "my-templates"`
   - Manages filtering, preview, and creation

### Updated Components
1. **`BottomNav`** - Updated navigation items
   - From: Today, Tasks, Lists, History
   - To: Dashboard, Active, Templates, Archive

2. **`GoalTemplatesListView`** - Deprecated for page-level use
   - Still available for reference
   - Replaced by `TemplatesView` for production

### Unchanged Components
- `GoalTemplateCard` - Reused in Templates
- `GoalTemplatePreview` - Reused in Templates
- `CreateTemplateModal` - Reused in Templates
- `SystemHealthCard` - Reused in Dashboard
- `HeatmapCalendar` - Reused in Dashboard and Archive
- `CalendarViewSwitcher` - Reused in Archive

---

## Data Flow

### Dashboard
```
/dashboard → fetch aggregated data (current month) → SystemHealthCard + HeatmapCalendar
```

### Active
```
/active → fetch task templates → TaskForm + TaskRow (grouped by category)
```

### Templates
```
/templates → fetch all templates → separate system/user → segmented control → filtered grid
- Recommended: system templates (apply-only)
- My Templates: user templates (create/edit/delete)
```

### Archive
```
/archive → fetch full year of data → CalendarViewSwitcher with multiple views
- Daily, Weekly, Monthly, Yearly
- Read-only task history
```

---

## Key Changes to Navigation

**Before:**
```
Bottom Nav:
- 📋 Today (daily-only view)
- ✓ Tasks (management only)
- ⭐ Lists (dashboard + my plan + plans mixed)
- 📊 History (read-only history)
```

**After:**
```
Bottom Nav:
- 📈 Dashboard (reflection only)
- ✓ Active (execution only)
- ⭐ Templates (design & management)
- 📊 Archive (memory & proof)
```

---

## User Flows

### New User Onboarding
1. Land on homepage (`/`)
2. Click "View Dashboard" → `/dashboard`
3. See momentum snapshot and system health
4. Click "Explore Templates" → `/templates` → Recommended tab
5. Browse system templates
6. Preview and apply a template → creates tasks in Active
7. Go to `/active` to check off tasks

### Existing User
1. Open app
2. Check BottomNav
3. `/active` - execute and check off tasks
4. `/dashboard` - see progress
5. `/templates` - design new templates (My Templates tab)
6. `/archive` - review historical progress

---

## Benefits of New Architecture

1. **Clear Separation of Concerns**
   - Reflection (Dashboard)
   - Execution (Active)
   - Design (Templates)
   - Memory (Archive)

2. **Reduced Cognitive Load**
   - No mixing of read-only and executable UI
   - No mixing of history and management
   - Clear purpose for each section

3. **Improved User Mental Models**
   - Dashboard = "Where am I going?" / progress
   - Active = "What do I do now?"
   - Templates = "What should I do?"
   - Archive = "What have I done?"

4. **Better Information Architecture**
   - Templates separated from execution
   - System templates from user templates clearly delineated
   - No redundant tabs or pages
   - Single, focused purpose per page

5. **Simplified Navigation**
   - 4 core sections (fit in bottom nav)
   - Clear hierarchy and relationships
   - Each section self-contained
   - No nested dashboards or confusing tabs

---

## Files Modified

### New Files
- `/src/app/dashboard/page.tsx`
- `/src/app/archive/page.tsx`
- `/src/app/active/page.tsx`
- `/src/components/TemplatesView.tsx`

### Updated Files
- `/src/components/BottomNav.tsx` - Navigation items
- `/src/app/templates/page.tsx` - Now uses TemplatesView
- `/src/app/page.tsx` - Updated CTAs and navigation

### Preserved (Backward Compatible)
- `/src/app/history/` - Files still exist (can delete)
- `/src/app/tasks/` - Files still exist (can delete)
- `/src/app/today/` - Files still exist (can delete)
- `/src/components/GoalTemplatesListView.tsx` - Deprecated but available

---

## Deployment Notes

1. ✅ All new pages compile without errors
2. ✅ Bottom navigation updated
3. ✅ Homepage updated with new CTAs
4. ✅ Database schema unchanged (backward compatible)
5. ✅ All existing features preserved
6. ⚠️ Old routes (`/today`, `/tasks`, `/history`) should be removed after testing

---

## Testing Checklist

- [ ] Navigation bar displays all 4 tabs correctly
- [ ] Dashboard loads and displays heatmap
- [ ] Active page shows task list
- [ ] Templates page shows segmented control
- [ ] Recommended tab shows system templates
- [ ] My Templates tab shows user templates
- [ ] Archive displays calendar view switcher
- [ ] All filters work correctly
- [ ] Template creation works in My Templates
- [ ] Template application works in Recommended
- [ ] No 404s when navigating between sections
