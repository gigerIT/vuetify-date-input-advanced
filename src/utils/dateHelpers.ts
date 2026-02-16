/** Strip time portion, returning a date at midnight UTC */
export function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Check if two dates represent the same calendar day */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** Check if date is between start and end (inclusive) */
export function isInRange(date: Date, start: Date, end: Date): boolean {
  const d = startOfDay(date).getTime()
  const s = startOfDay(start).getTime()
  const e = startOfDay(end).getTime()
  const min = Math.min(s, e)
  const max = Math.max(s, e)
  return d >= min && d <= max
}

/** Check if a date is before another date (day precision) */
export function isBefore(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() < startOfDay(b).getTime()
}

/** Check if a date is after another date (day precision) */
export function isAfter(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() > startOfDay(b).getTime()
}

/** Get first day of the month */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

/** Get last day of the month */
export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

/** Add N months to a date, clamping the day to avoid overflow */
export function addMonths(date: Date, n: number): Date {
  const d = new Date(date)
  const targetMonth = d.getMonth() + n
  d.setMonth(targetMonth)
  // If day overflow pushed us into the wrong month, clamp to last day of target month
  const expected = ((targetMonth % 12) + 12) % 12
  if (d.getMonth() !== expected) {
    d.setDate(0) // last day of the previous month (the intended target)
  }
  return d
}

/** Get the number of days in a month */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

/** Get the day of the week (0=Sun, 1=Mon, ..., 6=Sat) */
export function getDayOfWeek(date: Date): number {
  return date.getDay()
}

/** Get ISO week number */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

/** Check if two dates are in the same month */
export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

/** Format a date as a simple string. Uses built-in toLocaleDateString. */
export function formatDate(date: Date, locale = 'en-US'): string {
  return date.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Ensure a value is a Date object */
export function toDate(value: Date | string): Date {
  if (value instanceof Date) return value
  return new Date(value)
}

/** Clamp a date between min and max */
export function clampDate(date: Date, min?: Date, max?: Date): Date {
  const d = startOfDay(date).getTime()
  if (min && d < startOfDay(min).getTime()) return min
  if (max && d > startOfDay(max).getTime()) return max
  return date
}

/**
 * Build calendar grid for a given month.
 * Returns 6 weeks × 7 days = 42 dates (including adjacent month overflow).
 */
export function buildMonthGrid(
  year: number,
  month: number,
  firstDayOfWeek = 0,
): Date[] {
  const firstDay = new Date(year, month, 1)
  let startDay = firstDay.getDay() - firstDayOfWeek
  if (startDay < 0) startDay += 7

  const gridStart = new Date(year, month, 1 - startDay)
  const grid: Date[] = []

  for (let i = 0; i < 42; i++) {
    grid.push(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i))
  }

  return grid
}
