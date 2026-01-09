# YearlyHeatmap Component Documentation

## Overview

The `YearlyHeatmap` component renders a GitHub-style contribution graph that visualizes task completion consistency across an entire year. It displays all 365 (or 366 for leap years) days with color intensity based on the number of completed tasks.

## Features

- ✅ **GitHub-style layout**: Columns = weeks (Monday-Sunday), Rows = days of week
- ✅ **Month labels**: Visual month headers spanning appropriate week ranges
- ✅ **Automatic leap year handling**: 366 days for leap years, 365 for regular years
- ✅ **Color intensity mapping**: 0 → gray, 1-2 → light green, 3-4 → medium green, 5+ → dark green
- ✅ **Interactive tooltips**: Hover to see date and task count
- ✅ **Click handling**: Optional callback for drill-down functionality
- ✅ **Accessibility**: Comprehensive aria-labels, keyboard navigation, screen reader support
- ✅ **No hydration mismatches**: Proper client-side state management for Next.js
- ✅ **Dark mode support**: Full Tailwind dark mode compatibility
- ✅ **Responsive**: Horizontal scroll on small screens
- ✅ **No external dependencies**: Pure React, Tailwind CSS, no charting libraries

## Installation

The component uses Tailwind CSS and TypeScript. Ensure your project has:
- Next.js 13+ (App Router)
- Tailwind CSS
- TypeScript

## File Structure

```
src/
├── components/
│   └── YearlyHeatmap.tsx          # Main component
├── lib/
│   ├── heatmap-date-utils.ts       # Date generation and formatting
│   ├── heatmap-color-utils.ts      # Color mapping logic
│   └── heatmap-example.ts          # Example usage and integration
```

## Usage

### Basic Example

```tsx
import YearlyHeatmap from '@/components/YearlyHeatmap';

export default function Page() {
  const year = 2025;
  const data = {
    "2025-01-01": 3,
    "2025-01-02": 5,
    "2025-03-14": 2,
    // ... more dates
  };

  return (
    <YearlyHeatmap
      year={year}
      data={data}
    />
  );
}
```

### With Click Handler (Drill-down)

```tsx
import { useRouter } from 'next/navigation';
import YearlyHeatmap from '@/components/YearlyHeatmap';

export default function Page() {
  const router = useRouter();
  const year = 2025;
  const data = { /* ... */ };

  const handleDayClick = (date: Date, count: number) => {
    const dateStr = date.toISOString().slice(0, 10);
    router.push(`/tasks/${dateStr}`);
  };

  return (
    <YearlyHeatmap
      year={year}
      data={data}
      onDayClick={handleDayClick}
    />
  );
}
```

### Fetching Data from Supabase

```tsx
import { createClient } from '@supabase/supabase-js';
import YearlyHeatmap from '@/components/YearlyHeatmap';

const supabase = createClient(url, key);

async function getYearlyData(year: number) {
  const { data, error } = await supabase
    .from('daily_task_logs')
    .select('created_at')
    .gte('created_at', `${year}-01-01T00:00:00`)
    .lt('created_at', `${year + 1}-01-01T00:00:00`);

  if (error) throw new Error(error.message);

  // Aggregate by date
  const aggregated: Record<string, number> = {};
  data.forEach((log) => {
    const date = log.created_at.slice(0, 10); // Extract YYYY-MM-DD
    aggregated[date] = (aggregated[date] ?? 0) + 1;
  });

  return aggregated;
}

export default async function Page() {
  const year = new Date().getFullYear();
  const data = await getYearlyData(year);

  return <YearlyHeatmap year={year} data={data} />;
}
```

## Component Props

```tsx
interface YearlyHeatmapProps {
  /** The year to display (e.g., 2025) */
  year: number;

  /** Aggregated task data: { "YYYY-MM-DD": count } */
  data: Record<string, number>;

  /** Optional callback when a day is clicked */
  onDayClick?: (date: Date, count: number) => void;

  /** Optional CSS class for the container */
  className?: string;
}
```

## Data Format

The component expects aggregated data as a simple object:

```ts
type TaskData = Record<string, number>;

// Example:
const data: TaskData = {
  "2025-01-01": 2,    // 2 tasks completed on Jan 1
  "2025-01-02": 5,    // 5 tasks completed on Jan 2
  "2025-03-14": 1,    // 1 task completed on Mar 14
  // ... more dates
};
```

**Keys**: Must be in `YYYY-MM-DD` format  
**Values**: Number of tasks completed (must be >= 0)  
**Missing dates**: Automatically treated as 0 (no activity)

## Color Intensity Mapping

| Count | Color | Class | Meaning |
|-------|-------|-------|---------|
| 0 | Light Gray | `bg-gray-200` | No activity |
| 1-2 | Light Green | `bg-emerald-100` | Light activity |
| 3-4 | Medium Green | `bg-emerald-400` | Medium activity |
| 5+ | Dark Green | `bg-emerald-600` | High activity |

## Utility Functions

### Date Utilities (`heatmap-date-utils.ts`)

#### `generateYearWeeks(year: number): (Date | null)[][]`
Generates all dates in a year, organized by week (Monday-Sunday).

```ts
const weeks = generateYearWeeks(2025);
// Returns 53 weeks, each with 7 days (some may be null for padding)
```

#### `formatDateKey(date: Date): string`
Converts a Date to `YYYY-MM-DD` string for data lookup.

```ts
const key = formatDateKey(new Date(2025, 0, 1));
// Returns: "2025-01-01"
```

#### `getCountForDate(date: Date, data: Record<string, number>): number`
Gets the count for a specific date from the data object.

```ts
const count = getCountForDate(new Date(2025, 0, 1), data);
// Returns: 3 (or 0 if no data for that date)
```

#### `isLeapYear(year: number): boolean`
Checks if a year is a leap year.

```ts
isLeapYear(2024); // true
isLeapYear(2025); // false
```

#### `getDaysInYear(year: number): number`
Gets the number of days in a year (365 or 366).

```ts
getDaysInYear(2024); // 366
getDaysInYear(2025); // 365
```

### Color Utilities (`heatmap-color-utils.ts`)

#### `getColorClass(count: number): string`
Gets the Tailwind color class for a completion count.

```ts
getColorClass(0);  // "bg-gray-200 dark:bg-gray-700"
getColorClass(5);  // "bg-emerald-600 dark:bg-emerald-400"
```

#### `getColorLabel(count: number): string`
Gets a human-readable intensity label.

```ts
getColorLabel(0);  // "No activity"
getColorLabel(3);  // "Medium activity"
```

#### `getColorValue(count: number): string`
Gets the CSS color hex value (useful for custom styling).

```ts
getColorValue(0);  // "#e5e7eb"
getColorValue(5);  // "#059669"
```

### New: Date Utilities with Month Labels

#### `getMonthLabelsForWeeks(year: number, weeks: (Date | null)[][]): WeekMonthInfo[]`

Maps weeks to months for rendering month labels across the heatmap top.

```ts
interface WeekMonthInfo {
  month: string;        // "January", "February", etc.
  monthNumber: number;  // 0-11
  year: number;
  startWeek: number;    // First week this month appears
  endWeek: number;      // Last week this month appears
}

const monthLabels = getMonthLabelsForWeeks(2025, weeks);
// Returns month label info for positioning across week columns
```

## Dark Mode Support

The component automatically adapts to dark mode using Tailwind's `dark:` prefix classes. The color utilities include both light and dark variants:

```tsx
// Light mode: emerald-400 (medium green)
// Dark mode: emerald-600 (adjusted for dark backgrounds)
```

Dark mode colors are also defined in `globals.css` to ensure proper rendering across all scenarios.

## Hydration Safety

The component is designed to prevent Next.js hydration mismatches:

1. **Week and month calculations** are memoized and happen during render
2. **Hover state** is only applied after the component mounts (`useEffect`)
3. **No conditional rendering** based on browser APIs happens before mount
4. **Consistent initial render** means server and client output matches

This ensures the component works seamlessly with Next.js App Router and Server Components.

## Performance Considerations

- **No nested loops**: Uses map-based lookups for O(1) data access
- **Memoization**: Week generation and month labels are memoized with `useMemo()`
- **Hydration safe**: Hover state is only applied after component mounts to avoid SSR/client mismatches
- **Efficient rendering**: Only renders what's visible in the year
- **Lazy generation**: Dates are generated on demand, not precomputed

## Customization

### Changing Color Thresholds

Edit `heatmap-color-utils.ts` and modify the `getColorClass()` function:

```ts
const getColorClass = (count: number): string => {
  if (count === 0) return "bg-gray-200 dark:bg-gray-700";
  if (count <= 5) return "bg-blue-100 dark:bg-blue-900";      // Changed
  if (count <= 10) return "bg-blue-400 dark:bg-blue-600";     // Changed
  return "bg-blue-600 dark:bg-blue-400";                      // Changed
};
```

### Custom Tooltips

Modify the tooltip JSX in `YearlyHeatmap.tsx`:

```tsx
{isHovered && (
  <div className="...">
    <div className="...">
      <div className="font-semibold">{dateKey}</div>
      <div>Custom text here</div>
    </div>
  </div>
)}
```

### Different Layout (Rows = Weeks)

If you prefer weeks as rows instead of columns, modify `generateYearWeeks()` to return a transposed structure.

## Accessibility

The component includes comprehensive accessibility features:

- **Aria labels**: Each day cell has a detailed aria-label describing the date, day name, task count, and activity level
- **Keyboard navigation**: Days with click handlers are focusable and activatable via Enter/Space
- **Screen reader support**: All interactive elements are properly labeled and described
- **Month labels**: Visual month headers help with navigation and understanding date ranges
- **Color independence**: Intensity levels are conveyed through both color and text labels (e.g., "No activity", "Light activity")

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- All modern browsers supporting CSS Grid and Tailwind CSS

## FAQ

**Q: Can I use this with server-side data fetching?**  
A: Yes! Fetch the data in a server component, then pass it to the client component.

**Q: How do I handle large datasets?**  
A: The component is efficient. Even with 365 days × high interaction, performance is excellent.

**Q: Can I display multiple years?**  
A: Wrap multiple `YearlyHeatmap` components or create a container that switches between years.

**Q: Does it work with Next.js 12 (Pages Router)?**  
A: Yes, but remove the `"use client"` directive and adjust imports.

## Examples

See `src/lib/heatmap-example.ts` for a complete working example with Supabase integration.

## License

Use freely in your project. No attribution required.
