/**
 * Native-feel haptic feedback for mobile web.
 * Uses Vibration API where supported. No-ops on unsupported devices.
 */

type HapticPattern = "tap" | "soft" | "success" | "warn" | "select";

const PATTERNS: Record<HapticPattern, number | number[]> = {
  tap: 10,
  soft: 6,
  select: [4, 12, 4],
  success: [12, 40, 18],
  warn: [22, 30, 22, 30, 22],
};

export function haptic(pattern: HapticPattern = "tap") {
  if (typeof window === "undefined") return;
  try {
    const nav = window.navigator;
    if (nav && typeof nav.vibrate === "function") {
      nav.vibrate(PATTERNS[pattern]);
    }
  } catch {
    // ignore
  }
}