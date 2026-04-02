import type {
  AdvancedDateAdapter,
  AdvancedDateModel,
  AdvancedDateRangeObject,
  AdvancedDateRangeTuple,
  NormalizedRange,
} from '@/types'

export function isRangeTuple<TDate>(value: unknown): value is AdvancedDateRangeTuple<TDate> {
  return Array.isArray(value) && value.length === 2
}

export function isRangeObject<TDate>(value: unknown): value is AdvancedDateRangeObject<TDate> {
  return !!value && typeof value === 'object' && 'start' in value && 'end' in value
}

export function normalizeModel<TDate>(
  adapter: AdvancedDateAdapter<TDate>,
  value: AdvancedDateModel<TDate>,
  range: boolean,
): NormalizedRange<TDate> {
  if (value == null) return { start: null, end: null }

  if (!range) {
    return {
      start: isValid(adapter, value) ? value : null,
      end: null,
    }
  }

  if (isRangeTuple<TDate>(value)) {
    return orderRange(adapter, { start: value[0] ?? null, end: value[1] ?? null })
  }

  if (isRangeObject<TDate>(value)) {
    return orderRange(adapter, { start: value.start ?? null, end: value.end ?? null })
  }

  return {
    start: isValid(adapter, value) ? value : null,
    end: null,
  }
}

export function serializeModel<TDate>(
  range: NormalizedRange<TDate>,
  options: { range: boolean; returnObject: boolean },
): AdvancedDateModel<TDate> {
  if (!options.range) return range.start ?? null

  if (!range.start && !range.end) return null

  if (options.returnObject) {
    return {
      start: range.start,
      end: range.end,
    }
  }

  return [range.start, range.end] as const
}

export function orderRange<TDate>(
  adapter: AdvancedDateAdapter<TDate>,
  range: NormalizedRange<TDate>,
): NormalizedRange<TDate> {
  if (!range.start || !range.end) return range
  if (adapter.isAfter(range.start, range.end)) {
    return {
      start: range.end,
      end: range.start,
    }
  }

  return range
}

function isValid<TDate>(adapter: AdvancedDateAdapter<TDate>, value: unknown): value is TDate {
  return value != null && adapter.isValid(value)
}
