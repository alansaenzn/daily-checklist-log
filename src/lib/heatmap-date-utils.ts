/**
 * Utility functions for generating and organizing dates for a yearly heatmap.
 * Follows GitHub's contribution graph layout: weeks as columns, days of week as rows.
 */

/**
 * Generates all dates in a given year, organized by week (Monday-Sunday).
 * Returns a 2D array where each sub-array is a week (7 elements, may include nulls for padding).
 *
 * @param year - The year to generate dates for
 * @returns Array of weeks, each containing 7 day values (null for days outside the year)
 */
export function generateYearWeeks(year: number): (Date | null)[][] {
  const startDate = new Date(year, 0, 1); // January 1st
  const endDate = new Date(year, 11, 31); // December 31st

  // Calculate starting Monday: if Jan 1 is not Monday, go back to the previous Monday
  const startDayOfWeek = startDate.getDay(); // 0 = Sunday, 1 = Monday
  const daysToMonday = (startDayOfWeek + 6) % 7; // How many days back to Monday
  const weekStart = new Date(startDate);
  weekStart.setDate(weekStart.getDate() - daysToMonday);

  // Build weeks
  const weeks: (Date | null)[][] = [];
  let currentDate = new Date(weekStart);

  while (currentDate <= endDate) {
    const week: (Date | null)[] = [];

    for (let i = 0; i < 7; i++) {
      // Only include dates within the target year
      if (currentDate.getFullYear() === year) {
        week.push(new Date(currentDate));
      } else {
        week.push(null);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    weeks.push(week);
  }

  return weeks;
}

/**
 * Converts a Date to YYYY-MM-DD string for data lookup.
 *
 * @param date - The date to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Gets the count for a specific date from the data object.
 *
 * @param date - The date to look up
 * @param data - The aggregated data object (Record<YYYY-MM-DD, count>)
 * @returns The count for that date, or 0 if not found
 */
export function getCountForDate(date: Date, data: Record<string, number>): number {
  const key = formatDateKey(date);
  return data[key] ?? 0;
}

/**
 * Returns day name abbreviations for the row headers (Mon-Sun).
 *
 * @returns Array of day name abbreviations
 */
export function getDayLabels(): string[] {
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
}

/**
 * Gets the week number for a given date (for potential future use).
 *
 * @param date - The date to get the week number for
 * @returns The ISO week number (1-53)
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Checks if a year is a leap year.
 *
 * @param year - The year to check
 * @returns True if the year is a leap year, false otherwise
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Gets the number of days in a given year.
 *
 * @param year - The year to check
 * @returns 366 for leap years, 365 for non-leap years
 */
export function getDaysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

/**
 * Maps weeks to months, indicating which month each week belongs to.
 * Used for rendering month labels across the top of the heatmap.
 *
 * @param year - The year to analyze
 * @param weeks - The weeks array from generateYearWeeks
 * @returns Array with month info for each week: { month: string, startWeek: number }
 */
export interface WeekMonthInfo {
  month: string; // e.g., "January", "February"
  monthNumber: number; // 0-11
  year: number;
  startWeek: number; // First week this month appears
  endWeek: number; // Last week this month appears
}

export function getMonthLabelsForWeeks(
  year: number,
  weeks: (Date | null)[][]
): WeekMonthInfo[] {
  const monthLabels: WeekMonthInfo[] = [];
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  let currentMonth = -1;
  let monthStartWeek = 0;

  for (let weekIdx = 0; weekIdx < weeks.length; weekIdx++) {
    const week = weeks[weekIdx];

    // Find the first non-null date in this week
    const firstDateInWeek = week.find((d) => d !== null);

    if (firstDateInWeek) {
      const month = firstDateInWeek.getMonth();

      // If we've moved to a new month, save the previous one
      if (month !== currentMonth && currentMonth !== -1) {
        monthLabels.push({
          month: monthNames[currentMonth],
          monthNumber: currentMonth,
          year,
          startWeek: monthStartWeek,
          endWeek: weekIdx - 1,
        });
        monthStartWeek = weekIdx;
      }

      currentMonth = month;
    }
  }

  // Push the last month
  if (currentMonth !== -1) {
    monthLabels.push({
      month: monthNames[currentMonth],
      monthNumber: currentMonth,
      year,
      startWeek: monthStartWeek,
      endWeek: weeks.length - 1,
    });
  }

  return monthLabels;
}
