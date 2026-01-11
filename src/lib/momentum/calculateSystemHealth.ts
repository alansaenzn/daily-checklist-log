/**
 * System Health Calculation
 * 
 * Measures momentum = consistency × effort using difficulty-weighted completion
 * 
 * Formula:
 * systemHealth = (sum(weightedDailyScores) / days) * 100
 */

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Non-linear difficulty → effort points mapping
 * Harder tasks contribute more to momentum
 */
const DIFFICULTY_POINTS: Record<DifficultyLevel, number> = {
  1: 1,
  2: 2,
  3: 3,
  4: 5,
  5: 8,
};

/**
 * Momentum weights applied after daily score calculation
 */
const MOMENTUM_WEIGHTS = {
  active: 1.0,
  neutral: 0.4,
  inactive: 0.1,
};

export type DayType = "active" | "neutral" | "inactive";

export interface Task {
  difficulty: DifficultyLevel;
}

export interface MomentumDay {
  date: string; // YYYY-MM-DD format
  scheduledTasks: Task[];
  completedTasks: Task[];
}

export interface SystemHealthResult {
  percent: number;
  breakdown: {
    active: number;
    neutral: number;
    inactive: number;
  };
}

/**
 * Calculate effort sum from task list, respecting difficulty points
 */
function calculateEffort(tasks: Task[]): number {
  return tasks.reduce((sum, task) => {
    const points = DIFFICULTY_POINTS[task.difficulty] ?? 3; // default to 3 if invalid
    return sum + points;
  }, 0);
}

/**
 * Determine day type based on completion ratio
 * 
 * - Active: completed ≥ 60% of scheduled effort
 * - Neutral: completed > 0% but < 60%
 * - Inactive: no scheduled effort (or 0% completion)
 */
function getDayType(completedEffort: number, scheduledEffort: number): DayType {
  if (scheduledEffort === 0) {
    return "inactive";
  }

  const completionRatio = completedEffort / scheduledEffort;
  if (completionRatio >= 0.6) {
    return "active";
  }

  return completionRatio > 0 ? "neutral" : "inactive";
}

/**
 * Calculate daily momentum score (0-1 range)
 * 
 * Normalized so one perfect day never exceeds 1.0
 */
function calculateDailyScore(completedEffort: number, scheduledEffort: number): number {
  if (scheduledEffort === 0) {
    return 0;
  }

  // Normalize: completed effort / scheduled effort, capped at 1.0
  return Math.min(1, completedEffort / Math.max(scheduledEffort, 1));
}

/**
 * Calculate weighted daily score based on day type and effort
 */
function calculateWeightedDailyScore(
  dailyScore: number,
  dayType: DayType
): number {
  if (dayType === "inactive") {
    // Inactive days always contribute a fixed small amount
    return MOMENTUM_WEIGHTS.inactive;
  }

  // Active/Neutral: weight the achieved daily score
  const weight = dayType === "active" ? MOMENTUM_WEIGHTS.active : MOMENTUM_WEIGHTS.neutral;
  return dailyScore * weight;
}

/**
 * Main calculation: System Health from momentum days
 */
export function calculateSystemHealth(
  days: MomentumDay[],
  windowSize: number = 7
): SystemHealthResult {
  if (days.length === 0) {
    return {
      percent: 0,
      breakdown: {
        active: 0,
        neutral: 0,
        inactive: 0,
      },
    };
  }

  let breakdown = {
    active: 0,
    neutral: 0,
    inactive: 0,
  };

  let weightedScoreSum = 0;
  const daysToAnalyze = Math.min(days.length, windowSize);

  for (let i = 0; i < daysToAnalyze; i++) {
    const day = days[i];

    const scheduledEffort = calculateEffort(day.scheduledTasks);
    const completedEffort = calculateEffort(day.completedTasks);

    const dailyScore = calculateDailyScore(completedEffort, scheduledEffort);
    const dayType = getDayType(completedEffort, scheduledEffort);
    const weightedScore = calculateWeightedDailyScore(dailyScore, dayType);

    breakdown[dayType]++;
    weightedScoreSum += weightedScore;
  }

  const percent = Math.round((weightedScoreSum / daysToAnalyze) * 100);

  return {
    percent: Math.max(0, Math.min(100, percent)), // Clamp to 0-100
    breakdown,
  };
}
