/**
 * Utility functions for mapping task completion counts to color intensities.
 * Uses Tailwind CSS utility classes for consistent styling.
 */

/**
 * Color intensity thresholds for heatmap cells.
 * Defines the mapping between completion count ranges and visual intensity.
 */
export const COLOR_THRESHOLDS = {
  none: 0,
  light: 3,
  medium: 7,
  dark: 10,
} as const;

export const MOMENTUM_THRESHOLD_DEFAULT = 5;

export function getMomentumColorClass(count: number, momentumThreshold: number): string {
  if (count === 0) {
    return "bg-gray-200 dark:bg-gray-700";
  }

  if (count >= momentumThreshold) {
    return "bg-emerald-600 dark:bg-emerald-400";
  }

  return "bg-emerald-100 dark:bg-emerald-900";
}

export function getMomentumColorLabel(count: number, momentumThreshold: number): string {
  if (count === 0) return "No activity";
  if (count >= momentumThreshold) return "Meets momentum threshold";
  return "Below momentum threshold";
}

/**
 * Gets the Tailwind color class for a given completion count.
 * Follows a gradient: gray (0) → light green (1-2) → medium green (3-4) → dark green (5+)
 *
 * @param count - The number of tasks completed on that day
 * @returns Tailwind CSS class name for the background color
 */
export function getColorClass(count: number): string {
  if (count === 0) {
    return "bg-gray-200 dark:bg-gray-700";
  }
  if (count <= 3) {
    return "bg-emerald-100 dark:bg-emerald-900";
  }
  if (count <= 7) {
    return "bg-emerald-400 dark:bg-emerald-600";
  }
  // count >= 10
  return "bg-emerald-600 dark:bg-emerald-400";
}

/**
 * Gets the color intensity label for display/analytics purposes.
 *
 * @param count - The number of tasks completed
 * @returns A human-readable intensity label
 */
export function getColorLabel(count: number): string {
  if (count === 0) return "No activity";
  if (count <= 3) return "Light activity";
  if (count <= 7) return "Medium activity";
  return "High activity";
}

/**
 * Gets RGB values for a completion count (useful for custom styling or charts).
 *
 * @param count - The number of tasks completed
 * @returns Object with r, g, b values (0-255)
 */
export function getColorRGB(count: number): { r: number; g: number; b: number } {
  if (count === 0) {
    return { r: 229, g: 231, b: 235 }; // gray-200
  }
  if (count <= 2) {
    return { r: 220, g: 252, b: 231 }; // emerald-100
  }
  if (count <= 4) {
    return { r: 52, g: 211, b: 153 }; // emerald-400
  }
  return { r: 5, g: 150, b: 105 }; // emerald-600
}

/**
 * Gets the CSS custom property value for a completion count.
 * Useful for dynamic styling without hardcoding colors.
 *
 * @param count - The number of tasks completed
 * @returns CSS color value (hex, rgb, or named color)
 */
export function getColorValue(count: number): string {
  if (count === 0) return "#e5e7eb";
  if (count <= 3) return "#dcfce7";
  if (count <= 7) return "#34d399";
  return "#059669";
}

/**
 * Gets contrast text color (white or dark) for a given completion count.
 *
 * @param count - The number of tasks completed
 * @returns Text color class name ("text-white" or "text-gray-900")
 */
export function getTextColorClass(count: number): string {
  // Only the darkest intensity needs white text for contrast
  if (count >= 7) {
    return "text-white";
  }
  return "text-gray-900";
}
