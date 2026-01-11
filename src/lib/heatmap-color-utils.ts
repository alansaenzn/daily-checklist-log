/**
 * Utility functions for mapping task completion counts to color intensities.
 * Uses Tailwind CSS utility classes for consistent styling.
 */

import type { IntensityThresholds } from "@/lib/user-settings";
import { DEFAULT_INTENSITY_THRESHOLDS } from "@/lib/user-settings";

export type IntensityLevel = "none" | "light" | "medium" | "high" | "peak";

export function normalizeIntensityThresholds(
  thresholds?: Partial<IntensityThresholds>
): IntensityThresholds {
  return {
    light: thresholds?.light ?? DEFAULT_INTENSITY_THRESHOLDS.light,
    medium: thresholds?.medium ?? DEFAULT_INTENSITY_THRESHOLDS.medium,
    high: thresholds?.high ?? DEFAULT_INTENSITY_THRESHOLDS.high,
    peak: thresholds?.peak ?? DEFAULT_INTENSITY_THRESHOLDS.peak,
  };
}

export function getIntensityLevel(count: number, thresholds?: Partial<IntensityThresholds>): IntensityLevel {
  if (count <= 0) return "none";
  const resolved = normalizeIntensityThresholds(thresholds);
  if (count >= resolved.peak) return "peak";
  if (count >= resolved.high) return "high";
  if (count >= resolved.medium) return "medium";
  if (count >= resolved.light) return "light";
  return "light";
}

export function getIntensityColorClass(count: number, thresholds?: Partial<IntensityThresholds>): string {
  const level = getIntensityLevel(count, thresholds);
  // Inactive: clearly darker than card background for contrast
  if (level === "none") return "bg-gray-200 dark:bg-gray-700";
  // Active levels: bright emerald in dark mode so they pop against dark card
  if (level === "light") return "bg-emerald-100 dark:bg-emerald-500";
  if (level === "medium") return "bg-emerald-400 dark:bg-emerald-400";
  if (level === "high") return "bg-emerald-600 dark:bg-emerald-300";
  // Peak: brightest in dark mode to stand out; pair with dark text
  return "bg-emerald-800 text-white dark:bg-emerald-200";
}

export function getIntensityLabel(count: number, thresholds?: Partial<IntensityThresholds>): string {
  const level = getIntensityLevel(count, thresholds);
  if (level === "none") return "No activity";
  if (level === "light") return "Light activity";
  if (level === "medium") return "Medium activity";
  if (level === "high") return "High activity";
  return "Peak activity";
}

/**
 * Gets the Tailwind color class for a given completion count.
 * Follows a gradient: gray (0) → light green (1-2) → medium green (3-4) → dark green (5+)
 *
 * @param count - The number of tasks completed on that day
 * @returns Tailwind CSS class name for the background color
 */
export function getColorClass(count: number, thresholds?: Partial<IntensityThresholds>): string {
  return getIntensityColorClass(count, thresholds);
}

/**
 * Gets the color intensity label for display/analytics purposes.
 *
 * @param count - The number of tasks completed
 * @returns A human-readable intensity label
 */
export function getColorLabel(count: number, thresholds?: Partial<IntensityThresholds>): string {
  return getIntensityLabel(count, thresholds);
}

/**
 * Gets RGB values for a completion count (useful for custom styling or charts).
 *
 * @param count - The number of tasks completed
 * @returns Object with r, g, b values (0-255)
 */
export function getColorRGB(count: number, thresholds?: Partial<IntensityThresholds>): { r: number; g: number; b: number } {
  const level = getIntensityLevel(count, thresholds);
  if (level === "none") return { r: 229, g: 231, b: 235 };
  if (level === "light") return { r: 220, g: 252, b: 231 };
  if (level === "medium") return { r: 52, g: 211, b: 153 };
  if (level === "high") return { r: 5, g: 150, b: 105 };
  return { r: 6, g: 95, b: 70 };
}

/**
 * Gets the CSS custom property value for a completion count.
 * Useful for dynamic styling without hardcoding colors.
 *
 * @param count - The number of tasks completed
 * @returns CSS color value (hex, rgb, or named color)
 */
export function getColorValue(count: number, thresholds?: Partial<IntensityThresholds>): string {
  const level = getIntensityLevel(count, thresholds);
  if (level === "none") return "#e5e7eb";
  if (level === "light") return "#dcfce7";
  if (level === "medium") return "#34d399";
  if (level === "high") return "#059669";
  return "#065f46";
}

/**
 * Gets contrast text color (white or dark) for a given completion count.
 *
 * @param count - The number of tasks completed
 * @returns Text color class name ("text-white" or "text-gray-900")
 */
export function getTextColorClass(count: number, thresholds?: Partial<IntensityThresholds>): string {
  const level = getIntensityLevel(count, thresholds);
  // Use dark text for peak (very bright) to ensure contrast; white for high
  if (level === "high") {
    return "text-white dark:text-gray-900";
  }
  if (level === "peak") {
    return "text-gray-900";
  }
  return "text-gray-900";
}
