import type { DateInputAdvancedLocaleMessages } from '@/types'

export const dateInputAdvancedEn: DateInputAdvancedLocaleMessages = {
  dateInputAdvanced: {
    actions: {
      apply: 'Apply',
      cancel: 'Cancel',
    },
    ariaLabel: {
      previousMonth: 'Previous month',
      nextMonth: 'Next month',
    },
    errors: {
      invalidDate: 'Enter a valid date',
      unavailableDate: 'Date is unavailable',
      invalidRange: 'Enter a valid date range',
      unavailableRange: 'One or more dates are unavailable',
    },
    live: {
      selectedDate: 'Selected date {0}. {1}',
      selectedRange: 'Selected range {0} to {1}. {2}',
    },
    presets: {
      today: 'Today',
      yesterday: 'Yesterday',
      last7Days: 'Last 7 Days',
      last30Days: 'Last 30 Days',
      thisMonth: 'This Month',
      lastMonth: 'Last Month',
      thisQuarter: 'This Quarter',
      lastQuarter: 'Last Quarter',
      yearToDate: 'Year to Date',
      lastYear: 'Last Year',
    },
    week: {
      short: 'Wk',
    },
  },
}
