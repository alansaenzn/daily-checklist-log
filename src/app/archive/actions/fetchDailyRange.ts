"use server";

import { supabaseServer } from "@/lib/supabase/server";
import {
  fetchCompletedCountByDate,
  fetchCompletedTasksByDate,
  fetchScheduledTasksByDate,
  getEarliestLogDate,
} from "@/lib/archive-data";
import { ArchiveDailyTaskEntry } from "@/types/archive";

interface FetchDailyRangeResult {
  data: {
    completedCountByDate: Record<string, number>;
    completedTasksByDate: Record<string, ArchiveDailyTaskEntry[]>;
    scheduledTasksByDate: Record<string, { title: string; category: string }[]>;
  };
  hasMorePast: boolean;
}

export async function fetchDailyArchiveRange(
  startDate: string,
  endDate: string
): Promise<FetchDailyRangeResult> {
  if (!startDate || !endDate) {
    throw new Error("Both startDate and endDate are required");
  }

  if (startDate > endDate) {
    throw new Error("startDate must be before or equal to endDate");
  }

  const supabase = supabaseServer();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    throw new Error("Not authenticated");
  }

  const userId = userData.user.id;

  const [completedCountByDate, completedTasksByDate, scheduledTasksByDate, earliestLogDate] =
    await Promise.all([
      fetchCompletedCountByDate(supabase, userId, startDate, endDate),
      fetchCompletedTasksByDate(supabase, userId, startDate, endDate),
      fetchScheduledTasksByDate(supabase, userId, startDate, endDate),
      getEarliestLogDate(supabase, userId),
    ]);

  const hasMorePast = Boolean(earliestLogDate && earliestLogDate < startDate);

  return {
    data: {
      completedCountByDate,
      completedTasksByDate,
      scheduledTasksByDate,
    },
    hasMorePast,
  };
}
