/**
 * Archive Page
 * Memory & Proof
 * 
 * Read-only view of completed tasks and activity history
 * - Calendar view with completed task counts
 * - Weekly / monthly / yearly heatmaps
 * - Completed tasks grouped by date
 * - Temporal navigation with previous/next arrows
 * - Scheduled task visibility
 * 
 * No checkboxes, no apply buttons, no creation flows
 */

import { supabaseServer } from "@/lib/supabase/server";
import { DateNavigationProvider } from "@/lib/DateNavigationContext";
import ArchiveView from "@/components/ArchiveView";
import {
  fetchCompletedCountByDate,
  fetchCompletedTasksByDate,
  fetchScheduledTasksByDate,
  formatDateKey,
  getEarliestLogDate,
} from "@/lib/archive-data";

export const metadata = {
  title: "Archive",
  description: "View your completed tasks and activity history",
};

export default async function ArchivePage() {
  const supabase = supabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user!;

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  // Fetch data for a full year to support all view modes
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);

  const yearlyStartISO = formatDateKey(yearStart);
  const yearlyEndISO = formatDateKey(yearEnd);

  // Fetch both completed and scheduled tasks
  const completedCountByDate = await fetchCompletedCountByDate(
    supabase,
    user.id,
    yearlyStartISO,
    yearlyEndISO
  );

  // For monthly view, fetch completed tasks
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const monthStartISO = formatDateKey(monthStart);
  const monthEndISO = formatDateKey(monthEnd);

  const completedTasksByDate = await fetchCompletedTasksByDate(
    supabase,
    user.id,
    monthStartISO,
    monthEndISO
  );

  // Fetch scheduled tasks for the same month view
  const scheduledTasksByDate = await fetchScheduledTasksByDate(
    supabase,
    user.id,
    monthStartISO,
    monthEndISO
  );

  const earliestLogDate = await getEarliestLogDate(supabase, user.id);
  const hasMorePast = Boolean(
    earliestLogDate && earliestLogDate < monthStartISO
  );

  const initialData = {
    completedCountByDate,
    completedTasksByDate,
    scheduledTasksByDate,
  };

  const initialDailyRange = {
    start: monthStartISO,
    end: monthEndISO,
    hasMorePast,
  };

  return (
    <DateNavigationProvider>
      <ArchiveView initialData={initialData} initialDailyRange={initialDailyRange} />
    </DateNavigationProvider>
  );
}
