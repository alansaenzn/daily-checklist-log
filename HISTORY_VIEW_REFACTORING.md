# History View Refactoring - Three View Modes

## Overview

The History view has been refactored to support three distinct visualization modes:
1. **Weekly** - Detailed view of one week with daily task counts
2. **Monthly** - Calendar grid showing the current month
3. **Heatmap** - Mini month heatmap with color intensity
4. **Yearly** - GitHub-style yearly contribution graph

## New Components

### WeeklyHeatmap.tsx
**Location**: `src/components/WeeklyHeatmap.tsx`

A detailed weekly view displaying 7 consecutive days with larger cards showing:
- Day name and date
- Large task count display
- Color-coded activity level
- Responsive grid (1 col mobile, 2 cols tablet, 4 cols desktop)

**Props**:
```typescript
interface WeeklyHeatmapProps {
  weekStart: Date;              // Monday of the week
  data: Record<string, number>; // { "YYYY-MM-DD": count }
}
```

**Features**:
- Dark mode support with Tailwind dark: classes
- Responsive card layout
- Week date range display in header
- Total tasks completed this week summary

## Updated Components

### CalendarViewSwitcher.tsx
**Location**: `src/app/history/CalendarViewSwitcher.tsx`

**Changes**:
- Extended ViewMode type from `"calendar" | "heatmap"` to `"weekly" | "monthly" | "heatmap" | "yearly"`
- Added four view mode buttons with localStorage persistence
- Changed localStorage key from `calendarViewMode` to `historyViewMode`
- Added proper mount detection with `useEffect` to prevent hydration mismatches
- Dark mode button styling with `dark:bg-gray-700` and `dark:hover:bg-gray-600`
- Wraps content in `rounded-xl border bg-white dark:bg-gray-900` container
- Passes `weekStart` prop to WeeklyHeatmap

**Props**:
```typescript
interface CalendarViewSwitcherProps {
  year: number;
  month: number;
  weekStart?: Date;              // Monday of current week
  data: Record<string, number>;
}
```

### history/page.tsx
**Location**: `src/app/history/page.tsx`

**Changes**:
- Refactored to fetch a full year's data (supports all view modes)
- Added `getWeekStart()` helper to calculate Monday of current week
- Added `fetchAggregatedData()` helper to consolidate data fetching logic
- Calculates multiple date ranges (weekly, monthly, yearly)
- Fetches yearly data in one query for optimal performance
- Aggregates all completed tasks by date
- Passes `weekStart` to CalendarViewSwitcher
- Added dark mode text classes (`text-gray-900 dark:text-white`, etc.)

**Data Flow**:
```
page.tsx (server)
  ↓ fetches full year
  ↓ aggregates by date
  ↓
CalendarViewSwitcher (client)
  ├→ selected view mode (localStorage)
  └→ renders appropriate component:
       ├ WeeklyHeatmap (weekStart + data)
       ├ CalendarMonthView (month + data)
       ├ HeatmapCalendar (month + data)
       └ YearlyHeatmap (year + data)
```

## localStorage Persistence

- **Key**: `historyViewMode`
- **Values**: `"weekly" | "monthly" | "heatmap" | "yearly"`
- **Default**: `"monthly"` (if not set)
- **Updated**: When user clicks a view mode button
- **Migration**: Old key `calendarViewMode` will be ignored; users will see default view on first load

## Date Range Calculations

### Weekly Range
```typescript
const weekStart = getWeekStart(today); // Monday of current week
const weekEnd = new Date(weekStart);
weekEnd.setDate(weekEnd.getDate() + 6); // Sunday
```

### Monthly Range
```typescript
const monthStart = new Date(year, month, 1);
const monthEnd = new Date(year, month + 1, 0); // Last day of month
```

### Yearly Range
```typescript
const yearStart = new Date(year, 0, 1);
const yearEnd = new Date(year, 11, 31);
```

## Dark Mode Support

All components include comprehensive dark mode styling:

### WeeklyHeatmap
- Cards: `bg-gray-200 dark:bg-gray-700` to `bg-emerald-600 dark:bg-emerald-400`
- Text: `text-gray-900 dark:text-white`, `text-gray-600 dark:text-gray-400`
- Borders: `dark:border-gray-600`

### CalendarViewSwitcher
- Active button: `bg-blue-600 dark:bg-blue-700`
- Inactive button: `bg-gray-100 dark:bg-gray-700`
- Container: `bg-white dark:bg-gray-900 dark:border-gray-700`

### history/page.tsx
- Header text: `text-gray-900 dark:text-white`
- Subtitle: `text-gray-600 dark:text-gray-400`

### globals.css
Added new rules:
```css
/* WeeklyHeatmap dark mode support */
.grid.grid-cols-1.gap-4 > div {
  background-color: #111 !important;
  border-color: #444 !important;
}

/* YearlyHeatmap and view containers */
.rounded-xl.border {
  background-color: #0a0a0a !important;
  border-color: #333 !important;
}
```

## Performance Optimizations

1. **Single query for full year**: Fetches all data once, reuses for all views
2. **Memoization**: CalendarViewSwitcher doesn't re-render on data changes
3. **Lazy component rendering**: Only renders selected view component
4. **Efficient aggregation**: O(n) single-pass aggregation in page.tsx

## Usage Example

```typescript
// User navigates to /history
// Server fetches full year data
// CalendarViewSwitcher renders with localStorage-persisted view (default: monthly)
// User clicks "Weekly" button
// View switches to WeeklyHeatmap showing current week
// localStorage updated with "weekly"
// On next visit, weekly view loads by default
```

## Testing Checklist

- [x] Weekly view displays current week's 7 days correctly
- [x] Monthly view shows month calendar with heatmap colors
- [x] Heatmap view shows mini month heatmap
- [x] Yearly view shows full year GitHub-style graph
- [x] View mode buttons update on click
- [x] localStorage persists view selection
- [x] No hydration mismatches (mount detection works)
- [x] Dark mode displays correctly for all views
- [x] Responsive design works on mobile, tablet, desktop
- [x] No TypeScript errors
- [x] Data aggregation is correct across all views

## Files Modified

1. **src/components/WeeklyHeatmap.tsx** (NEW)
2. **src/app/history/CalendarViewSwitcher.tsx** (UPDATED)
3. **src/app/history/page.tsx** (UPDATED)
4. **src/app/globals.css** (UPDATED)

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- All modern browsers with ES6+ support

## Future Enhancements

- Add date range picker for custom date ranges
- Add drill-down functionality (click day → view tasks for that day)
- Add export to CSV/PDF
- Add comparison view (compare weeks/months)
- Add filtering by task category
