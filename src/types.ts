import type { Component, StyleValue } from 'vue'

export interface AdvancedDateAdapter<TDate = Date> {
  date: (value?: any) => TDate | null
  format: (
    date: TDate,
    formatString: string | Record<string, unknown>,
  ) => string
  toISO: (date: TDate) => string
  parseISO: (value: string) => TDate
  startOfDay: (date: TDate) => TDate
  endOfDay: (date: TDate) => TDate
  startOfWeek?: (date: TDate, firstDayOfWeek?: number | string) => TDate
  startOfMonth: (date: TDate) => TDate
  endOfMonth: (date: TDate) => TDate
  startOfYear: (date: TDate) => TDate
  endOfYear: (date: TDate) => TDate
  isBefore: (date: TDate, comparing: TDate) => boolean
  isAfter: (date: TDate, comparing: TDate) => boolean
  isEqual: (date: TDate, comparing: TDate) => boolean
  isSameDay: (date: TDate, comparing: TDate) => boolean
  isSameMonth: (date: TDate, comparing: TDate) => boolean
  isValid: (date: any) => boolean
  isWithinRange: (date: TDate, range: [TDate, TDate]) => boolean
  addDays: (date: TDate, amount: number) => TDate
  addMonths: (date: TDate, amount: number) => TDate
  getYear: (date: TDate) => number
  setYear: (date: TDate, year: number) => TDate
  getMonth: (date: TDate) => number
  setMonth: (date: TDate, month: number) => TDate
  getWeek?: (
    date: TDate,
    firstDayOfWeek?: number | string,
    firstDayOfYear?: number | string,
  ) => number
  getWeekArray: (date: TDate, firstDayOfWeek?: number | string) => TDate[][]
  getWeekdays: (
    firstDayOfWeek?: number | string,
    weekdayFormat?: string,
  ) => string[]
}

export type AdvancedDateRangeTuple<TDate = Date> = readonly [
  TDate | null,
  TDate | null,
]

export type AdvancedDateIconSvgPath = string | [path: string, opacity: number]
export type AdvancedDateIconValue =
  | string
  | AdvancedDateIconSvgPath[]
  | Component

export type AdvancedDateInputField = 'start' | 'end'

export interface AdvancedDateInputFieldProps {
  placeholder?: string
  prependInnerIcon?: AdvancedDateIconValue
  appendInnerIcon?: AdvancedDateIconValue
  readonly?: boolean
  id?: string
  name?: string
  ariaLabel?: string
  class?: unknown
  style?: StyleValue
  attrs?: Record<string, string | number | boolean | null | undefined>
}

export interface AdvancedDateRangeObject<TDate = Date> {
  start: TDate | null
  end: TDate | null
}

export type AdvancedDateModel<TDate = Date> =
  | TDate
  | AdvancedDateRangeTuple<TDate>
  | AdvancedDateRangeObject<TDate>
  | null

export interface NormalizedRange<TDate = Date> {
  start: TDate | null
  end: TDate | null
}

export type AdvancedDateInputSource = 'text' | 'picker'
export type AdvancedDateInputParseStatus =
  | 'empty'
  | 'partial'
  | 'complete'
  | 'invalid'
export type AdvancedDateInputAvailabilityStatus =
  | 'unknown'
  | 'available'
  | 'unavailable'
export type AdvancedDateInputValidationStatus = 'idle' | 'valid' | 'invalid'
export type AdvancedDateInputCommitFailureReason =
  | 'invalid'
  | 'incomplete'
  | 'rule'
  | 'unavailable'
export type AdvancedDateInputCloseReason = 'cancel' | 'dismiss' | 'escape'
export type AdvancedDateInputCloseStrategy = 'revert' | 'preserve' | 'commit'
export type AdvancedDateInputCloseOutcome = 'closed' | 'blocked'

export interface AdvancedDateInputDraft<TDate = Date> {
  text: string
  selection: NormalizedRange<TDate>
  source: AdvancedDateInputSource
  isDirty: boolean
  parseStatus: AdvancedDateInputParseStatus
  availabilityStatus: AdvancedDateInputAvailabilityStatus
  validationStatus: AdvancedDateInputValidationStatus
  errorKey:
    | keyof DateInputAdvancedLocaleMessages['dateInputAdvanced']['errors']
    | null
}

export interface AdvancedDateInputCommitPayload<TDate = Date> {
  value: AdvancedDateModel<TDate>
  draft: AdvancedDateInputDraft<TDate>
}

export interface AdvancedDateInputInvalidPayload<TDate = Date> {
  reason: AdvancedDateInputCommitFailureReason
  draft: AdvancedDateInputDraft<TDate>
}

export interface AdvancedDateInputClosePayload<TDate = Date> {
  reason: AdvancedDateInputCloseReason
  strategy: AdvancedDateInputCloseStrategy
  outcome: AdvancedDateInputCloseOutcome
  draft: AdvancedDateInputDraft<TDate>
}

export interface AdvancedDateInputPublicInstance<TDate = Date> {
  commitInput: () => Promise<boolean>
  validate: () => Promise<string[]>
  resetValidation: () => Promise<void>
  revertDraft: () => void
  readonly text: string
  readonly draft: AdvancedDateInputDraft<TDate>
  readonly isDirty: boolean
  readonly isPristine: boolean
  readonly isValid: boolean | null
  readonly errorMessages: string[]
}

export interface PresetRange<TDate = Date> {
  label: string
  value: [TDate, TDate] | (() => [TDate, TDate])
  slot?: string
}

export interface DateInputAdvancedLocaleMessages {
  dateInputAdvanced: {
    actions: {
      apply: string
      cancel: string
    }
    fields: {
      startDate: string
      endDate: string
    }
    ariaLabel: {
      previousMonth: string
      nextMonth: string
    }
    errors: {
      invalidDate: string
      unavailableDate: string
      invalidRange: string
      unavailableRange: string
    }
    live: {
      selectedDate: string
      selectedRange: string
    }
    presets: {
      today: string
      yesterday: string
      last7Days: string
      last30Days: string
      thisMonth: string
      lastMonth: string
      thisQuarter: string
      lastQuarter: string
      yearToDate: string
      lastYear: string
    }
    week: {
      short: string
    }
  }
}

export interface AdvancedDateDay<TDate = Date> {
  date: TDate
  key: string
  label: string
  ariaLabel: string
  outside: boolean
  disabled: boolean
  today: boolean
  selected: boolean
  rangeStart: boolean
  rangeEnd: boolean
  inRange: boolean
  preview: boolean
}

export interface AdvancedDateWeek<TDate = Date> {
  index: number
  weekNumber?: number
  days: AdvancedDateDay<TDate>[]
}

export interface AdvancedDateMonthData<TDate = Date> {
  date: TDate
  key: string
  label: string
  weeks: AdvancedDateWeek<TDate>[]
  weekdays: string[]
}

export interface DateBounds<TDate = Date> {
  min?: TDate | null
  max?: TDate | null
  allowedDates?: ((date: TDate) => boolean) | undefined
  allowedStartDates?: ((date: TDate) => boolean) | undefined
  allowedEndDates?: ((date: TDate) => boolean) | undefined
}
