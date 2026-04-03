import type { AdvancedDateAdapter, DateBounds, NormalizedRange } from '@/types'
import { orderRange } from '@/util/model'

export function dateKey<TDate>(
  adapter: AdvancedDateAdapter<TDate>,
  date: TDate | null | undefined,
): string {
  return date ? adapter.toISO(date).split('T')[0] : ''
}

export function isSameDay<TDate>(
  adapter: AdvancedDateAdapter<TDate>,
  left: TDate | null | undefined,
  right: TDate | null | undefined,
): boolean {
  return !!left && !!right && adapter.isSameDay(left, right)
}

export function clampToBounds<TDate>(
  adapter: AdvancedDateAdapter<TDate>,
  date: TDate,
  bounds: Pick<DateBounds<TDate>, 'min' | 'max'>,
): TDate {
  if (bounds.min && adapter.isBefore(date, bounds.min)) return bounds.min
  if (bounds.max && adapter.isAfter(date, bounds.max)) return bounds.max
  return date
}

export function isDateDisabled<TDate>(
  adapter: AdvancedDateAdapter<TDate>,
  date: TDate,
  bounds: Pick<DateBounds<TDate>, 'min' | 'max' | 'allowedDates'>,
): boolean {
  if (bounds.min && adapter.isBefore(date, bounds.min)) return true
  if (bounds.max && adapter.isAfter(date, bounds.max)) return true
  if (bounds.allowedDates && !bounds.allowedDates(date)) return true
  return false
}

export function isStartDateDisabled<TDate>(
  adapter: AdvancedDateAdapter<TDate>,
  date: TDate,
  bounds: DateBounds<TDate>,
): boolean {
  if (isDateDisabled(adapter, date, bounds)) return true
  if (bounds.allowedStartDates && !bounds.allowedStartDates(date)) return true
  return false
}

export function isEndDateDisabled<TDate>(
  adapter: AdvancedDateAdapter<TDate>,
  date: TDate,
  bounds: DateBounds<TDate>,
): boolean {
  if (isDateDisabled(adapter, date, bounds)) return true
  if (bounds.allowedEndDates && !bounds.allowedEndDates(date)) return true
  return false
}

export function isRangeDisabled<TDate>(
  adapter: AdvancedDateAdapter<TDate>,
  range: NormalizedRange<TDate>,
  bounds: DateBounds<TDate>,
): boolean {
  if (!range.start && !range.end) return false
  if (range.start && !range.end)
    return isStartDateDisabled(adapter, range.start, bounds)
  if (!range.start || !range.end) return true

  return (
    isStartDateDisabled(adapter, range.start, bounds) ||
    isEndDateDisabled(adapter, range.end, bounds)
  )
}

export function isSelectionDateDisabled<TDate>(
  adapter: AdvancedDateAdapter<TDate>,
  date: TDate,
  selection: NormalizedRange<TDate>,
  range: boolean,
  bounds: DateBounds<TDate>,
): boolean {
  if (!range) return isStartDateDisabled(adapter, date, bounds)
  if (!selection.start || selection.end) {
    return isStartDateDisabled(adapter, date, bounds)
  }

  const next = orderRange(adapter, {
    start: selection.start,
    end: date,
  }) as NormalizedRange<TDate>

  return isRangeDisabled(adapter, next, bounds)
}

export function intersectsRange<TDate>(
  adapter: AdvancedDateAdapter<TDate>,
  date: TDate,
  range: NormalizedRange<TDate> | null | undefined,
): boolean {
  if (!range?.start || !range.end) return false
  return adapter.isWithinRange(date, [
    adapter.startOfDay(range.start),
    adapter.endOfDay(range.end),
  ])
}

export function monthIntersectsBounds<TDate>(
  adapter: AdvancedDateAdapter<TDate>,
  month: TDate,
  bounds: Pick<DateBounds<TDate>, 'min' | 'max'>,
): boolean {
  const start = adapter.startOfMonth(month)
  const end = adapter.endOfMonth(month)

  if (bounds.min && adapter.isBefore(end, adapter.startOfMonth(bounds.min)))
    return false
  if (bounds.max && adapter.isAfter(start, adapter.endOfMonth(bounds.max)))
    return false

  return true
}

export function formatInputValue<TDate>(
  adapter: AdvancedDateAdapter<TDate>,
  range: NormalizedRange<TDate>,
  options: { range: boolean; displayFormat: string; separator: string },
): string {
  if (!range.start && !range.end) return ''

  if (!options.range) {
    return range.start ? adapter.format(range.start, options.displayFormat) : ''
  }

  const start = range.start
    ? adapter.format(range.start, options.displayFormat)
    : ''
  const end = range.end ? adapter.format(range.end, options.displayFormat) : ''

  return [start, end].filter(Boolean).join(options.separator)
}

export function parseInputDate<TDate>(
  adapter: AdvancedDateAdapter<TDate>,
  value: string,
  parseInput?: ((value: string) => TDate | null) | undefined,
): TDate | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const custom = parseInput?.(trimmed)
  if (custom && adapter.isValid(custom)) return custom

  const direct = adapter.date(trimmed)
  if (direct && adapter.isValid(direct)) return direct

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const iso = adapter.parseISO(trimmed)
    if (iso && adapter.isValid(iso)) return iso
  }

  const timestamp = Date.parse(trimmed)
  if (!Number.isNaN(timestamp)) {
    const parsed = adapter.date(new Date(timestamp))
    if (parsed && adapter.isValid(parsed)) return parsed
  }

  return null
}
