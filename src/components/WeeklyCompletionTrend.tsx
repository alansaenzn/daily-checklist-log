"use client";
import React, { useMemo } from "react";

type WeeklyCompletionTrendProps = {
  dailyCounts: Record<string, number>; // { 'YYYY-MM-DD': count }
  weeks?: number; // default 12
};

function formatDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfISOWeek(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday start
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, days: number) {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + days);
  return nd;
}

export default function WeeklyCompletionTrend({ dailyCounts, weeks = 12 }: WeeklyCompletionTrendProps) {
  const series = useMemo(() => {
    // Build last N weeks totals ending in current week (Monday start)
    const endWeekStart = startOfISOWeek(new Date());
    const weeksArr: { label: string; value: number; start: Date }[] = [];

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = addDays(endWeekStart, -7 * i);
      let total = 0;
      for (let d = 0; d < 7; d++) {
        const day = addDays(weekStart, d);
        total += dailyCounts[formatDateKey(day)] || 0;
      }
      const label = weekStart.toLocaleDateString("en-US", { month: "short" });
      weeksArr.push({ label, value: total, start: weekStart });
    }
    return weeksArr;
  }, [dailyCounts, weeks]);

  const maxValue = Math.max(1, ...series.map((s) => s.value));

  // Fixed desktop width (320px) with CSS scaling for mobile responsiveness
  const width = 320;
  const height = 100;
  const padding = { left: 6, right: 6, top: 8, bottom: 14 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = series.map((s, i) => {
    const x = (i / (series.length - 1)) * chartW + padding.left;
    const y = height - padding.bottom - (s.value / maxValue) * chartH;
    return { x, y, v: s.value, label: s.label };
  });

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const area = `${path} L${points[points.length - 1].x.toFixed(1)},${height - padding.bottom} L${points[0].x.toFixed(1)},${height - padding.bottom} Z`;

  // Simple month tick labels every time the label changes from previous
  const monthTicks = points
    .map((p, i) => (i === 0 || p.label !== points[i - 1].label ? { x: p.x, label: p.label } : null))
    .filter(Boolean) as { x: number; label: string }[];

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 md:p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-base md:text-lg font-extrabold">This week</h4>
        <div className="text-right">
          <div className="text-[9px] md:text-xs text-gray-500">Completed</div>
          <div className="text-lg md:text-xl font-bold">{series[series.length - 1]?.value ?? 0}</div>
        </div>
      </div>
      <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1 md:mt-2">Past {weeks} weeks</div>

      <svg width={width} height={height} className="mt-2 md:mt-3 block w-full h-auto">
        {/* Grid lines */}
        <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#525252" strokeOpacity="0.4" />
        <line x1={padding.left} y1={padding.top} x2={width - padding.right} y2={padding.top} stroke="#525252" strokeOpacity="0.2" />

        {/* Area fill */}
        <path d={area} fill="#fb923c10" stroke="none" />
        {/* Line */}
        <path d={path} fill="none" stroke="#f97316" strokeWidth={2} />
        {/* Points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={4} fill="#0a0a0a" opacity={0.9} />
            <circle cx={p.x} cy={p.y} r={3} fill="#f97316" />
          </g>
        ))}

        {/* Month labels */}
        {monthTicks.map((t, i) => (
          <text key={`m-${i}`} x={t.x} y={height - 2} textAnchor="middle" fontSize="8" fill="currentColor" className="text-gray-600 dark:text-gray-300">
            {t.label.toUpperCase()}
          </text>
        ))}
      </svg>
    </div>
  );
}
