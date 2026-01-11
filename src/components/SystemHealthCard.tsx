"use client";

import { useMemo } from "react";

interface SystemHealthCardProps {
  systemHealthPercent: number;
  activeDays: number;
  neutralDays: number;
  inactiveDays: number;
}

export function SystemHealthCard({
  systemHealthPercent,
  activeDays,
  neutralDays,
  inactiveDays,
}: SystemHealthCardProps) {
  const totalDays = activeDays + neutralDays + inactiveDays;
  
  // Use passed systemHealthPercent for the ring display
  const displayPercent = systemHealthPercent;

  // Generate insight text
  const getInsightText = () => {
    if (totalDays === 0) {
      return "Start tracking your momentum to see your progress.";
    }
    if (systemHealthPercent >= 90) {
      return "Exceptional consistency! You're crushing it.";
    }
    if (systemHealthPercent >= 70) {
      return "Strong momentum. You're showing up consistently.";
    }
    if (systemHealthPercent >= 50) {
      return "Good effort. Keep building on this momentum.";
    }
    if (systemHealthPercent >= 25) {
      return "Building momentum. Every task counts.";
    }
    return "Ready to build momentum? Start with one task today.";
  };

  // SVG ring chart - creates a circular progress visualization
  // Fixed desktop size (140px) with CSS transform for mobile responsiveness
  const svgSize = 140;
  const circleRadius = 45;
  const circumference = 2 * Math.PI * circleRadius;
  const displayOffset = ((100 - displayPercent) / 100) * circumference;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-3 md:p-6 space-y-3 md:space-y-4">
      {/* Header */}
      <div className="space-y-0.5 md:space-y-1">
        <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white">
          System Health
        </h3>
        <p className="text-[9px] md:text-xs uppercase font-medium text-gray-500 dark:text-gray-400 tracking-wide">
          Momentum Snapshot
        </p>
      </div>

      {/* Main Content - Ring Chart + Insight */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-6 items-start md:items-center">
        {/* Ring Chart */}
        <div className="flex-shrink-0 w-[100px] md:w-[140px]">
          <svg
            width={svgSize}
            height={svgSize}
            viewBox="0 0 120 120"
            role="img"
            aria-label={`${displayPercent}% system health`}
            className="w-full h-auto"
          >
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r={circleRadius}
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-gray-200 dark:text-gray-700"
            />

            {/* Health progress segment */}
            <circle
              cx="60"
              cy="60"
              r={circleRadius}
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeDasharray={`${(displayPercent / 100) * circumference} ${circumference}`}
              strokeDashoffset="0"
              className="text-green-500 dark:text-green-400 transition-all"
              strokeLinecap="round"
            />

            {/* Center text */}
            <text
              x="60"
              y="68"
              textAnchor="middle"
              className="font-black fill-gray-900 dark:fill-white"
              fontSize="24"
              fontWeight="900"
            >
              {displayPercent}%
            </text>
          </svg>
        </div>

        {/* Insight and Stats */}
        <div className="flex-1 space-y-2 md:space-y-3 min-w-0">
          {/* Insight text */}
          <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {getInsightText()}
          </p>

          {/* Stats breakdown */}
          <div className="space-y-1 md:space-y-2">
            {/* Active days */}
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 dark:bg-green-400 flex-shrink-0" />
              <span className="text-[11px] md:text-xs text-gray-600 dark:text-gray-400">
                {activeDays} active {activeDays === 1 ? "day" : "days"}
              </span>
            </div>

            {/* Neutral days */}
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-blue-400 dark:bg-blue-500 flex-shrink-0" />
              <span className="text-[11px] md:text-xs text-gray-600 dark:text-gray-400">
                {neutralDays} neutral {neutralDays === 1 ? "day" : "days"}
              </span>
            </div>

            {/* Inactive days */}
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-gray-400 dark:bg-gray-500 flex-shrink-0" />
              <span className="text-[11px] md:text-xs text-gray-600 dark:text-gray-400">
                {inactiveDays} inactive {inactiveDays === 1 ? "day" : "days"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer message */}
      <div className="pt-2 md:pt-3 border-t border-gray-100 dark:border-gray-800">
        <p className="text-[9px] md:text-xs text-gray-500 dark:text-gray-400 text-center">
          Tracking your daily momentum · {totalDays} days
        </p>
      </div>
    </div>
  );
}
