import { buildDateRange, getRangeEdges, toModelArray } from '@/utils/dateHelpers'

interface FormatOptions {
  range: boolean
  separator: string
  displayFormat?: string | ((date: unknown) => string)
}

interface ParseOptions {
  range: boolean
  separator: string
  inputFormat?: string
}

type DateAdapter = ReturnType<typeof import('vuetify').useDate>

function parseByFormat(adapter: DateAdapter, value: string, inputFormat: string): unknown | null {
  const normalized = value.trim()
  if (!normalized) return null

  if (inputFormat === 'yyyy-mm-dd') {
    const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (!match) return null
    const parsed = adapter.parseISO(`${match[1]}-${match[2]}-${match[3]}`)
    return adapter.isValid(parsed) ? parsed : null
  }

  if (inputFormat === 'dd/mm/yyyy') {
    const match = normalized.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (!match) return null
    const parsed = adapter.parseISO(`${match[3]}-${match[2]}-${match[1]}`)
    return adapter.isValid(parsed) ? parsed : null
  }

  if (inputFormat === 'mm/dd/yyyy') {
    const match = normalized.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (!match) return null
    const parsed = adapter.parseISO(`${match[3]}-${match[1]}-${match[2]}`)
    return adapter.isValid(parsed) ? parsed : null
  }

  const fallback = adapter.date(normalized)
  return fallback && adapter.isValid(fallback) ? fallback : null
}

function formatOne(
  adapter: DateAdapter,
  value: unknown,
  displayFormat?: string | ((date: unknown) => string),
): string {
  if (typeof displayFormat === 'function') return displayFormat(value)
  if (displayFormat) return adapter.format(value, displayFormat)
  return adapter.format(value, 'fullDate')
}

export function formatDisplayValue(
  adapter: DateAdapter,
  modelValue: unknown | unknown[] | null,
  options: FormatOptions,
): string {
  if (!options.range) {
    if (modelValue == null) return ''
    return formatOne(adapter, modelValue, options.displayFormat)
  }

  const edges = getRangeEdges(modelValue)
  if (!edges.start) return ''

  const start = formatOne(adapter, edges.start, options.displayFormat)
  if (!edges.end || adapter.isSameDay(edges.start, edges.end)) return start

  return `${start}${options.separator}${formatOne(adapter, edges.end, options.displayFormat)}`
}

export function parseInputValue(
  adapter: DateAdapter,
  raw: string,
  options: ParseOptions,
): unknown | unknown[] | null {
  const input = raw.trim()
  if (!input) return options.range ? [] : null

  const inputFormat = options.inputFormat ?? 'yyyy-mm-dd'

  if (!options.range) {
    return parseByFormat(adapter, input, inputFormat)
  }

  const parts = input
    .split(options.separator)
    .map((part) => part.trim())
    .filter(Boolean)

  if (!parts.length) return []

  if (parts.length === 1) {
    const start = parseByFormat(adapter, parts[0], inputFormat)
    return start ? [start] : []
  }

  const start = parseByFormat(adapter, parts[0], inputFormat)
  const end = parseByFormat(adapter, parts[parts.length - 1], inputFormat)

  if (!start || !end) return []
  return buildDateRange(adapter, start, end)
}

export function getRangeBoundaryPayload(value: unknown | unknown[] | null): {
  start: unknown | null
  end: unknown | null
  count: number
} {
  const arr = toModelArray(value)
  const edges = getRangeEdges(value)
  return {
    start: edges.start,
    end: edges.end,
    count: arr.length,
  }
}
