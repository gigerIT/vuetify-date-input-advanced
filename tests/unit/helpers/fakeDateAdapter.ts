function atStartOfDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()))
}

function toDate(value?: unknown): Date {
  if (value instanceof Date) return atStartOfDay(value)
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value)
    return atStartOfDay(parsed)
  }
  return atStartOfDay(new Date('2026-01-01T00:00:00.000Z'))
}

export const fakeDateAdapter = {
  date(value?: unknown) {
    return toDate(value)
  },
  parseISO(value: string) {
    return toDate(`${value}T00:00:00.000Z`)
  },
  isValid(value: unknown) {
    return value instanceof Date && !Number.isNaN(value.getTime())
  },
  format(value: unknown, formatString?: string) {
    const date = toDate(value)
    if (formatString === 'monthAndYear') {
      return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
    }
    return date.toISOString().slice(0, 10)
  },
  toISO(value: unknown) {
    return toDate(value).toISOString().slice(0, 10)
  },
  startOfDay(value: unknown) {
    return toDate(value)
  },
  endOfDay(value: unknown) {
    const date = toDate(value)
    date.setUTCHours(23, 59, 59, 999)
    return date
  },
  startOfMonth(value: unknown) {
    const date = toDate(value)
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
  },
  endOfMonth(value: unknown) {
    const date = toDate(value)
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0))
  },
  startOfYear(value: unknown) {
    const date = toDate(value)
    return new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  },
  endOfYear(value: unknown) {
    const date = toDate(value)
    return new Date(Date.UTC(date.getUTCFullYear(), 11, 31))
  },
  addDays(value: unknown, amount: number) {
    const date = toDate(value)
    date.setUTCDate(date.getUTCDate() + amount)
    return date
  },
  addMonths(value: unknown, amount: number) {
    const date = toDate(value)
    date.setUTCMonth(date.getUTCMonth() + amount)
    return date
  },
  getMonth(value: unknown) {
    return toDate(value).getUTCMonth()
  },
  getYear(value: unknown) {
    return toDate(value).getUTCFullYear()
  },
  isBefore(a: unknown, b: unknown) {
    return toDate(a).getTime() < toDate(b).getTime()
  },
  isAfter(a: unknown, b: unknown) {
    return toDate(a).getTime() > toDate(b).getTime()
  },
  isSameDay(a: unknown, b: unknown) {
    return toDate(a).toISOString().slice(0, 10) === toDate(b).toISOString().slice(0, 10)
  },
  isWithinRange(value: unknown, range: [unknown, unknown]) {
    const target = toDate(value).getTime()
    const start = toDate(range[0]).getTime()
    const end = toDate(range[1]).getTime()
    return target >= start && target <= end
  },
  setMonth(value: unknown, month: number) {
    const date = toDate(value)
    date.setUTCMonth(month)
    return date
  },
}
