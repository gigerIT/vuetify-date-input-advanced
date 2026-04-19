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
