/**
 * Clamp a value between a minimum and maximum value.
 * @param value - The value to clamp
 * @param min - The minimum value
 * @param max - The maximum value
 * @returns The clamped value, or min if value is not finite
 */
export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min
  }
  return Math.min(max, Math.max(min, value))
}
