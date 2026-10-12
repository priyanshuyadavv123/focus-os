/**
 * Date utilities for FOCUS OS.
 * All 'today' logic uses Asia/Kolkata timezone.
 * Dates are stored strictly as YYYY-MM-DD strings.
 */

export const TIMEZONE = 'Asia/Kolkata';

export function getTodayDateString(now: Date = new Date()): string {
  // Format to YYYY-MM-DD in Asia/Kolkata
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now);
}

export function isValidDateString(dateStr: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}
