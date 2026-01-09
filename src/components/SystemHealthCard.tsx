"use client";

import { useMemo } from "react";

interface SystemHealthCardProps {
  activeDays: number;
  neutralDays: number;
  inactiveDays: number;
}

export function SystemHealthCard({
  activeDays,
  neutralDays,
  inactiveDays,
}: SystemHealthCardProps) {
  const totalDays = activeDays + neutralDays + inactiveDays;
  
  // Calculate percentages
  const activePercent = totalDays > 0 ? Math.round((activeDays / totalDays) * 100) : 0;
  const neutralPercent = totalDays > 0 ? Math.round((neutralDays / totalDays) * 100) : 0;
  const inactivePercent = totalDays > 0 ? Math.round((inactiveDays / totalDays) * 100) : 0;

  // Generate insight text
  const getInsightText = () => {
    if (totalDays === 0) {
      return "Start tracking your momentum to see your progress.";
    }
    if (activeDays === totalDays) {
      return `Perfect consistency! You completed tasks for all ${totalDays} days.`;
    }
    if (activeDays === 0) {
      return "Ready to build momentum? Start with one task today.";
    }
    return `You completed tasks on ${activeDays} of the last ${totalDays} days.`;
  };

  // SVG ring chart - creates a circular progress visualization
  const circumference = 2 * Math.PI * 45; // radius = 45
  const activeOffset = 0;
  const neutralOffset = (activePercent / 100) * circumference;
  const inactiveOffset = ((activePercent + neutralPercent) / 100) * circumference;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          System Health
        </h3>
        <p className="text-xs uppercase font-medium text-gray-500 dark:text-gray-400 tracking-wide">
          Momentum Snapshot
        </p>
      </div>

      {/* Main Content - Ring Chart + Insight */}
      <div className="flex gap-6 items-center">
        {/* Ring Chart */}
        <div className="flex-shrink-0">
          <svg
            width="140"
            height="140"
            viewBox="0 0 120 120"
            role="img"
            aria-label={`${activePercent}% active days, ${neutralPercent}% neutral days, ${inactivePercent}% inactive days`}
          >
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-gray-200 dark:text-gray-700"
            />

            {/* Active days segment (green) */}
            {activeDays > 0 && (
              <circle
                cx="60"
                cy="60"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${(activePercent / 100) * circumference} ${circumference}`}
                strokeDashoffset="0"
                className="text-green-500 dark:text-green-400 transition-all"
                strokeLinecap="round"
              />
            )}

            {/* Neutral days segment (muted blue-gray) */}
            {neutralDays > 0 && (
              <circle
                cx="60"
                cy="60"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${(neutralPercent / 100) * circumference} ${circumference}`}
                strokeDashoffset={-neutralOffset}
                className="text-blue-400 dark:text-blue-500 transition-all"
                strokeLinecap="round"
              />
            )}

            {/* Inactive days segment (very subtle gray) */}
            {inactiveDays > 0 && (
              <circle
                cx="60"
                cy="60"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${(inactivePercent / 100) * circumference} ${circumference}`}
                strokeDashoffset={-inactiveOffset}
                className="text-gray-400 dark:text-gray-500 transition-all"
                strokeLinecap="round"
              />
            )}

            {/* Center text */}
            <text
              x="60"
              y="68"
              textAnchor="middle"
              className="text-2xl font-black fill-gray-900 dark:fill-white"
              fontSize="24"
              fontWeight="900"
            >
              {activePercent}%
            </text>
          </svg>
        </div>

        {/* Insight and Stats */}
        <div className="flex-1 space-y-3 min-w-0">
          {/* Insight text */}
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {getInsightText()}
          </p>

          {/* Stats breakdown */}
          <div className="space-y-2">
            {/* Active days */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400 flex-shrink-0" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {activeDays} active {activeDays === 1 ? "day" : "days"}
              </span>
            </div>

            {/* Neutral days */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400 dark:bg-blue-500 flex-shrink-0" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {neutralDays} neutral {neutralDays === 1 ? "day" : "days"}
              </span>
            </div>

            {/* Inactive days */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 flex-shrink-0" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {inactiveDays} inactive {inactiveDays === 1 ? "day" : "days"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer message */}
      <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Tracking your daily momentum · {totalDays} days
        </p>
      </div>
    </div>
  );
}
