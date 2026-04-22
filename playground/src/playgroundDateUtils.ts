import type {
  AdvancedDateInputDraft,
  AdvancedDateModel,
  AdvancedDateRangeObject,
} from '@gigerit/vuetify-date-input-advanced'

function cloneDate(date: Date | null | undefined) {
  return date ? new Date(date) : null
}

export function createLocalDate(year: number, month: number, day: number) {
  return new Date(year, month, day)
}

export function formatDemoDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function toLocalYmd(date: Date | null | undefined) {
  if (!date) return null

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

export function normalizeRangeModel(
  value: AdvancedDateModel<Date>,
): AdvancedDateRangeObject<Date> {
  if (Array.isArray(value)) {
    return {
      start: value[0],
      end: value[1],
    }
  }

  if (value && typeof value === 'object' && 'start' in value && 'end' in value) {
    return value
  }

  if (value instanceof Date) {
    return {
      start: value,
      end: value,
    }
  }

  return {
    start: null,
    end: null,
  }
}

export function coercePlaygroundModel(
  value: AdvancedDateModel<Date>,
  options: {
    range: boolean
    returnObject: boolean
    fallbackDate?: Date | null
  },
): AdvancedDateModel<Date> {
  const normalized = normalizeRangeModel(value)
  const fallback =
    normalized.start ?? normalized.end ?? cloneDate(options.fallbackDate) ?? null

  if (!options.range) return cloneDate(fallback)
  if (!normalized.start && !normalized.end && !fallback) return null

  const coercedRange = {
    start: cloneDate(normalized.start ?? fallback),
    end: cloneDate(normalized.end),
  }

  if (options.returnObject) {
    return coercedRange
  }

  return [coercedRange.start, coercedRange.end] as const
}

export function serializePreviewModel(value: AdvancedDateModel<Date>) {
  if (value == null) return null
  if (Array.isArray(value)) return value.map((item) => toLocalYmd(item))
  if (value instanceof Date) return toLocalYmd(value)
  if ('start' in value && 'end' in value) {
    return {
      start: toLocalYmd(value.start),
      end: toLocalYmd(value.end),
    }
  }

  return value
}

export function serializeDraft(draft: AdvancedDateInputDraft<Date>) {
  return {
    ...draft,
    selection: {
      start: toLocalYmd(draft.selection.start),
      end: toLocalYmd(draft.selection.end),
    },
  }
}

export function allowOnly(...allowedDates: string[]) {
  const allowed = new Set(allowedDates)

  return (date: Date) => allowed.has(toLocalYmd(date) ?? '')
}

function toUtcCalendarDay(date: Date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
}

export function countCalendarNights(start: Date, end: Date) {
  return Math.round(
    (toUtcCalendarDay(end) - toUtcCalendarDay(start)) / 86_400_000,
  )
}
