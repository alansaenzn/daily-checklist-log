/**
 * Example usage and integration guide for YearlyHeatmap component.
 * This demonstrates how to fetch data from Supabase and render the heatmap.
 */

import React from "react";
import YearlyHeatmap from "@/components/YearlyHeatmap";

/**
 * Example: Fetching aggregated task data from Supabase
 * This would typically be in a server-side action or API route.
 */
export async function fetchYearlyTaskData(year: number): Promise<Record<string, number>> {
  // Example: assuming you have a Supabase client and daily_task_logs table
  // const { data, error } = await supabase
  //   .from("daily_task_logs")
  //   .select("created_at")
  //   .gte("created_at", `${year}-01-01`)
  //   .lt("created_at", `${year + 1}-01-01`);
  //
  // if (error) throw new Error(error.message);
  //
  // // Aggregate by date
  // const aggregated: Record<string, number> = {};
  // data.forEach((log) => {
  //   const date = log.created_at.slice(0, 10); // YYYY-MM-DD
  //   aggregated[date] = (aggregated[date] ?? 0) + 1;
  // });
  //
  // return aggregated;

  // For now, return mock data
  return {
    "2025-01-01": 3,
    "2025-01-02": 5,
    "2025-01-03": 2,
    "2025-01-10": 7,
    "2025-02-14": 4,
    "2025-03-05": 6,
    "2025-12-25": 8,
  };
}

/**
 * Example component showing YearlyHeatmap integration
 */
export async function YearlyHeatmapExample() {
  const year = new Date().getFullYear();
  const data = await fetchYearlyTaskData(year);

  const handleDayClick = (date: Date, count: number) => {
    console.log(`Clicked ${date.toDateString()} with ${count} tasks completed`);
    // You could navigate to a detailed view of that day's tasks here
    // e.g., router.push(`/tasks/${date.toISOString().slice(0, 10)}`)
  };

  // Example return (JSX - would need to be in a React component)
  // return (
  //   <div className="p-8 max-w-6xl mx-auto">
  //     <YearlyHeatmap
  //       year={year}
  //       data={data}
  //       onDayClick={handleDayClick}
  //       className="mt-8"
  //     />
  //   </div>
  // );
}

export default YearlyHeatmapExample;
