import { computed, type ComputedRef, type Ref } from 'vue'

import type {
  AdvancedDateAdapter,
  AdvancedDateInputField,
  DateBounds,
  NormalizedRange,
} from '@/types'
import {
  dateKey,
  monthHasSelectableDate,
  monthIntersectsBounds,
} from '@/util/dates'

export const MONTH_SEARCH_BATCH = 12
const MAX_CACHED_MONTHS = 240

export type MonthSearchResult<TDate> =
  | { kind: 'found'; month: TDate }
  | { kind: 'boundary' }
  | { kind: 'pending'; through: TDate }

export type MonthAvailability<TDate> = ReturnType<
  typeof useAdvancedDateMonthAvailability<TDate>
>

export function useAdvancedDateMonthAvailability<TDate>(options: {
  adapter: AdvancedDateAdapter<TDate>
  selection: Ref<NormalizedRange<TDate>>
  selectionTargetField: Ref<AdvancedDateInputField | null>
  range: Ref<boolean>
  bounds: Ref<DateBounds<TDate>>
}) {
  const { adapter } = options
  const cache = new Map<string, ComputedRef<boolean>>()

  function hasDate(month: TDate) {
    const key = dateKey(adapter, month)
    let available = cache.get(key)
    if (!available) {
      // Each cached month tracks reactive reads inside consumer callbacks too.
      // Caching plain booleans would miss changes to a reactive availability set.
      available = computed(() =>
        monthHasSelectableDate(
          adapter,
          month,
          options.selection.value,
          options.range.value,
          options.bounds.value,
          options.selectionTargetField.value,
        ),
      )
      cache.set(key, available)
      if (cache.size > MAX_CACHED_MONTHS)
        cache.delete(cache.keys().next().value!)
    }
    return available.value
  }

  function monthDistance(from: TDate, to: TDate) {
    return (
      (adapter.getYear(to) - adapter.getYear(from)) * 12 +
      adapter.getMonth(to) -
      adapter.getMonth(from)
    )
  }

  function retainedMonths(extra: TDate[]) {
    return [
      options.selection.value.start,
      options.selection.value.end,
      ...extra,
    ].filter((date): date is TDate => date != null)
  }

  function find(
    from: TDate,
    direction: -1 | 1,
    span = MONTH_SEARCH_BATCH,
    retained: TDate[] = [],
  ): MonthSearchResult<TDate> {
    const bounds = options.bounds.value
    const keep = retainedMonths(retained)
    let month = adapter.startOfMonth(from)
    for (let index = 0; index < span; index++) {
      month = adapter.startOfMonth(adapter.addMonths(month, direction))
      if (
        !adapter.isValid(month) ||
        !monthIntersectsBounds(adapter, month, bounds)
      ) {
        return { kind: 'boundary' }
      }
      if (
        hasDate(month) ||
        keep.some((date) => adapter.isSameMonth(date, month))
      ) {
        return { kind: 'found', month }
      }
    }
    const next = adapter.startOfMonth(adapter.addMonths(month, direction))
    if (
      !adapter.isValid(next) ||
      !monthIntersectsBounds(adapter, next, bounds)
    ) {
      return { kind: 'boundary' }
    }
    // A callback has no discoverable last date. Exhausting a batch only pauses
    // the search; callers must offer continuation instead of disabling it.
    return { kind: 'pending', through: month }
  }

  function collect(
    anchor: TDate,
    count: number,
    span = MONTH_SEARCH_BATCH,
    retained: TDate[] = [],
  ) {
    const months = [adapter.startOfMonth(anchor)]
    let next: MonthSearchResult<TDate>
    while (true) {
      next = find(months.at(-1)!, 1, span, retained)
      if (months.length >= count || next.kind !== 'found') break
      months.push(next.month)
    }
    return { months, next }
  }

  function gap(from: TDate, to: TDate) {
    const count = monthDistance(from, to) - 1
    return count > 0
      ? {
          count,
          start: adapter.startOfMonth(adapter.addMonths(from, 1)),
          end: adapter.startOfMonth(adapter.addMonths(to, -1)),
        }
      : null
  }

  const constraints = computed(() => ({
    ...options.bounds.value,
    range: options.range.value,
  }))
  return { hasDate, find, collect, gap, monthDistance, constraints }
}
