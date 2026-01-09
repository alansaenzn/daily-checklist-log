"use client";

import React, { useMemo } from "react";

type HeatmapData = Record<string, number>;

export function KeyMetricsCarousel({
  data,
  difficultySumData,
  year,
  month, // 0-based (0 = January) to match `HeatmapCalendar`
  momentumThreshold,
  rangeMode = "mtd",
}: {
  data: HeatmapData;
  difficultySumData?: Record<string, number>;
  year: number;
  month: number;
  momentumThreshold: number;
  rangeMode?: "mtd" | "full";
}) {
  const { streakDays, consistencyPct, avgDifficulty, avgTasksPerDay } = useMemo(() => {
    const lastOfMonth = new Date(year, month + 1, 0);

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const endDay = rangeMode === "full" || !isCurrentMonth ? lastOfMonth.getDate() : today.getDate();

    const days: { key: string; count: number }[] = [];
    // Match `HeatmapCalendar` date keys (ISO date via toISOString().slice(0, 10))
    for (let day = 1; day <= endDay; day++) {
      const date = new Date(year, month, day);
      const key = date.toISOString().slice(0, 10);
      days.push({ key, count: data[key] ?? 0 });
    }

    // Current streak: consecutive days ending at today for current month,
    // otherwise ending at the last day of the month.
    const anchorIndex = isCurrentMonth
      ? Math.min(days.length - 1, today.getDate() - 1)
      : days.length - 1;
    let streak = 0;
    for (let i = anchorIndex; i >= 0; i--) {
      if (days[i].count > 0) streak++;
      else break;
    }

    // Consistency: active days / considered days
    const elapsedDays = days.length; // MTD = elapsed so far, Full = all days in month
    const activeDays = days.filter((d) => d.count > 0).length;
    const consistency = elapsedDays > 0 ? Math.round((activeDays / elapsedDays) * 100) : 0;

    // Avg difficulty: average of completed tasks' difficulty (1-5)
    // Falls back to threshold-scaled intensity if difficultySumData isn't provided.
    let avgDiff = 0;
    const totalTasks = days.reduce((sum, d) => sum + d.count, 0);
    if (difficultySumData && totalTasks > 0) {
      const totalDifficulty = days.reduce(
        (sum, d) => sum + (difficultySumData[d.key] ?? 0),
        0
      );
      avgDiff = round1(totalDifficulty / totalTasks);
    } else {
      const scale = Math.max(1, momentumThreshold);
      const difficulties: number[] = [];
      for (const d of days) {
        if (d.count > 0) {
          const val = Math.min(5, (d.count / scale) * 5);
          difficulties.push(val);
        }
      }
      avgDiff = difficulties.length
        ? round1(difficulties.reduce((a, b) => a + b, 0) / difficulties.length)
        : 0;
    }

    // Avg tasks per day across considered days
    const avgPerDay = elapsedDays
      ? round1(days.reduce((sum, d) => sum + d.count, 0) / elapsedDays)
      : 0;

    return {
      streakDays: streak,
      consistencyPct: consistency,
      avgDifficulty: avgDiff,
      avgTasksPerDay: avgPerDay,
    };
  }, [data, difficultySumData, year, month, momentumThreshold, rangeMode]);

  return (
    <div className="mt-4 -mx-2 px-2">
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1">
        <MetricCard
          emoji="🔥"
          title="Current Streak"
          value={`${streakDays} days`}
        />
        <MetricCard
          emoji="🗓️"
          title="Consistency"
          value={`${consistencyPct}%`}
        />
        <MetricCard
          emoji="⚡"
          title="Avg Difficulty"
          value={`${avgDifficulty} / 5`}
          subtitle={difficultySumData ? "From task difficulty" : "Scaled to threshold"}
        />
        <MetricCard
          emoji="✅"
          title="Tasks / Day"
          value={`${avgTasksPerDay}`}
        />
      </div>
    </div>
  );
}

function MetricCard({
  emoji,
  title,
  value,
  subtitle,
}: {
  emoji: string;
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="snap-start shrink-0 w-[220px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{emoji}</span>
        <h4 className="text-xs font-bold uppercase text-gray-900 dark:text-white tracking-wide">
          {title}
        </h4>
      </div>
      <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{value}</div>
      {subtitle ? (
        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{subtitle}</div>
      ) : null}
    </div>
  );
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export default KeyMetricsCarousel;
