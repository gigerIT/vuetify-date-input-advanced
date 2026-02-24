export interface DateAdapterLike {
  startOfDay(date: unknown): unknown
  addDays(date: unknown, amount: number): unknown
  isAfter(date: unknown, comparing: unknown): boolean
  isSameDay(date: unknown, comparing: unknown): boolean
}

export function toModelArray(value: unknown | unknown[] | null | undefined): unknown[] {
  if (Array.isArray(value)) return value
  if (value == null) return []
  return [value]
}

export function cloneModelValue(value: unknown | unknown[] | null | undefined): unknown | unknown[] | null {
  if (Array.isArray(value)) return [...value]
  return value ?? null
}

export function getRangeEdges(value: unknown | unknown[] | null | undefined): {
  start: unknown | null
  end: unknown | null
} {
  const arr = toModelArray(value)
  if (!arr.length) return { start: null, end: null }
  return {
    start: arr[0] ?? null,
    end: arr[arr.length - 1] ?? null,
  }
}

export function isRangeComplete(value: unknown | unknown[] | null | undefined): boolean {
  return toModelArray(value).length > 1
}

export function compareRange(
  adapter: DateAdapterLike,
  a: unknown | unknown[] | null | undefined,
  b: [unknown, unknown],
): boolean {
  const aEdges = getRangeEdges(a)
  if (!aEdges.start || !aEdges.end) return false
  return (
    adapter.isSameDay(aEdges.start, b[0]) &&
    adapter.isSameDay(aEdges.end, b[1])
  )
}

export function buildDateRange(adapter: DateAdapterLike, start: unknown, end: unknown): unknown[] {
  if (!adapter.isAfter(start, end)) {
    const out: unknown[] = []
    let cursor = adapter.startOfDay(start)
    const stop = adapter.startOfDay(end)
    let guard = 0

    while (!adapter.isAfter(cursor, stop) && guard < 4000) {
      out.push(cursor)
      cursor = adapter.addDays(cursor, 1)
      guard += 1
    }

    return out
  }

  return buildDateRange(adapter, end, start)
}
