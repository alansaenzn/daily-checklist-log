# History View Architecture Diagram

## Component Hierarchy

```
history/page.tsx (Server Component)
│
├─ User Authentication
│  └─ supabaseServer().auth.getUser()
│
├─ Date Calculations
│  ├─ getWeekStart(today) → Monday
│  ├─ monthStart, monthEnd
│  └─ yearStart, yearEnd
│
├─ Data Fetching
│  └─ fetchAggregatedData(yearStart → yearEnd)
│     └─ Supabase query: daily_task_logs
│     └─ Filter: user_id + date range
│     └─ Aggregate: count completed tasks per day
│     └─ Return: Record<"YYYY-MM-DD", number>
│
└─ Render
   └─ CalendarViewSwitcher (Client Component) ✨
      │
      ├─ State
      │  ├─ view: "weekly" | "monthly" | "heatmap" | "yearly"
      │  └─ mounted: boolean
      │
      ├─ Effects
      │  ├─ useEffect → read from localStorage
      │  └─ useEffect → persist to localStorage
      │
      ├─ Buttons (View Mode Selector)
      │  ├─ [Weekly]
      │  ├─ [Monthly]
      │  ├─ [Heatmap]
      │  └─ [Yearly]
      │
      └─ Conditional Renders
         ├─ view === "weekly" → WeeklyHeatmap
         │  ├─ Props: weekStart, data
         │  └─ Display: 7 cards (Mon-Sun)
         │
         ├─ view === "monthly" → CalendarMonthView
         │  ├─ Props: year, month, data
         │  └─ Display: Month grid with day cells
         │
         ├─ view === "heatmap" → HeatmapCalendar
         │  ├─ Props: year, month, data
         │  └─ Display: Mini month with color intensity
         │
         └─ view === "yearly" → YearlyHeatmap
            ├─ Props: year, data
            └─ Display: GitHub-style contribution graph
```

## Data Flow with Examples

### Scenario: First Visit to /history

```
1. User visits /history
   ↓
2. Server-side execution:
   - Get current user
   - Calculate: weekStart = 2025-01-06 (Monday)
   - Fetch: all tasks for 2025 from Supabase
   - Aggregate: {
       "2025-01-06": 3,
       "2025-01-07": 5,
       "2025-01-08": 2,
       ... (365 entries)
     }
   ↓
3. CalendarViewSwitcher mounts (Client)
   - localStorage.getItem("historyViewMode") → null
   - setView("monthly") // default
   - setMounted(true)
   ↓
4. CalendarViewSwitcher renders
   - Buttons: [Weekly] [Monthly✓] [Heatmap] [Yearly]
   - Content: <CalendarMonthView year={2025} month={0} data={...} />
   ↓
5. User sees: January 2025 calendar with completion heatmap
```

### Scenario: User Switches to Weekly View

```
1. User clicks [Weekly] button
   ↓
2. setView("weekly") triggered
   ↓
3. useEffect runs:
   - localStorage.setItem("historyViewMode", "weekly")
   ↓
4. CalendarViewSwitcher re-renders
   - Buttons: [Weekly✓] [Monthly] [Heatmap] [Yearly]
   - Content: <WeeklyHeatmap weekStart={2025-01-06} data={...} />
   ↓
5. WeeklyHeatmap renders 7 cards:
   - Monday 1/6: 3 tasks (Light activity)
   - Tuesday 1/7: 5 tasks (Medium activity)
   - Wednesday 1/8: 2 tasks (Light activity)
   - Thursday 1/9: 0 tasks (No activity)
   - Friday 1/10: 4 tasks (Medium activity)
   - Saturday 1/11: 7 tasks (High activity)
   - Sunday 1/12: 1 task (Light activity)
   ↓
6. User sees: Detailed week cards
```

### Scenario: Return Visit (localStorage Persisted)

```
1. User returns to /history (1 week later)
   ↓
2. Server-side same as before:
   - Fetch full year data
   - Same aggregation
   ↓
3. CalendarViewSwitcher mounts (Client)
   - localStorage.getItem("historyViewMode") → "weekly" ✓
   - setView("weekly")
   - setMounted(true)
   ↓
4. CalendarViewSwitcher renders
   - Buttons: [Weekly✓] [Monthly] [Heatmap] [Yearly]
   - Content: <WeeklyHeatmap weekStart={2025-01-13} data={...} />
   ↓
5. User sees: Weekly view IMMEDIATELY (no extra interaction needed)
```

## Component Props & Data Structure

### CalendarViewSwitcher

```typescript
Props: {
  year: 2025
  month: 0 (January)
  weekStart: Date(2025-01-06)
  data: {
    "2025-01-01": 2,
    "2025-01-02": 5,
    "2025-01-03": 1,
    ...
  }
}

State: {
  view: "weekly" | "monthly" | "heatmap" | "yearly"
  mounted: boolean
}

localStorage key: "historyViewMode"
```

### WeeklyHeatmap

```typescript
Props: {
  weekStart: Date(2025-01-06)  // Monday
  data: {
    "2025-01-06": 3,  // Mon
    "2025-01-07": 5,  // Tue
    "2025-01-08": 2,  // Wed
    "2025-01-09": 0,  // Thu
    "2025-01-10": 4,  // Fri
    "2025-01-11": 7,  // Sat
    "2025-01-12": 1,  // Sun
  }
}

Renders 7 cards (Mon-Sun):
- Card title: "Monday", "1/6"
- Card content: Count (large), tasks, activity level
- Card styling: Color based on count
```

### YearlyHeatmap

```typescript
Props: {
  year: 2025
  data: {
    "2025-01-01": 2,
    "2025-01-02": 5,
    ... (365 entries)
    "2025-12-31": 3,
  }
}

Renders:
- Header with year and total count
- Week columns with day cells
- Each cell colored by intensity
- Month labels across top
- Hover tooltips
```

## Color Legend (All Views)

```
Intensity Level | Count | Light Mode      | Dark Mode
───────────────┼───────┼─────────────────┼──────────────────
No Activity    | 0     | bg-gray-200     | bg-gray-700
Light Activity | 1-2   | bg-emerald-100  | bg-emerald-900
Medium Activity| 3-4   | bg-emerald-400  | bg-emerald-600
High Activity  | 5+    | bg-emerald-600  | bg-emerald-400
```

## View Capabilities Comparison

```
Feature           | Weekly | Monthly | Heatmap | Yearly
─────────────────┼────────┼─────────┼─────────┼──────────
Date Range       | 1 week | 1 month | 1 month | 1 year
Task Counts      | ✓      | ✓       | ✓       | ✓
Grid Layout      | Cards  | Grid    | Grid    | Columns
Hover Tooltips   | ✗      | ✓       | ✓       | ✓
Month Labels     | ✗      | ✗       | ✗       | ✓
Detailed View    | ✓      | ✓       | ✗       | ✗
Trend Overview   | ✗      | ✓       | ✓       | ✓
Yearly Patterns  | ✗      | ✗       | ✗       | ✓
```

## Dark Mode Styling

```
Light Mode                 Dark Mode
─────────────────────     ─────────────────────
bg-white                  bg-gray-900
bg-gray-100               bg-gray-700
text-gray-900             text-white
border-gray-200           border-gray-700
bg-blue-600 (button)      bg-blue-700
shadow-sm                 No shadow
```

---

This architecture ensures:
- ✅ Single data fetch per page load
- ✅ Fast view switching (no new queries)
- ✅ Persistent user preferences
- ✅ Responsive across all screen sizes
- ✅ Full dark mode support
- ✅ No hydration mismatches
