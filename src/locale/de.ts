import type { DateInputAdvancedLocaleMessages } from '@/types'

export const dateInputAdvancedDe: DateInputAdvancedLocaleMessages = {
  dateInputAdvanced: {
    actions: {
      apply: 'Übernehmen',
      cancel: 'Abbrechen',
    },
    ariaLabel: {
      previousMonth: 'Vorheriger Monat',
      nextMonth: 'Nächster Monat',
    },
    errors: {
      invalidDate: 'Geben Sie ein gültiges Datum ein',
      unavailableDate: 'Datum ist nicht verfügbar',
      invalidRange: 'Geben Sie einen gültigen Datumsbereich ein',
      unavailableRange: 'Ein oder mehrere Daten sind nicht verfügbar',
    },
    live: {
      selectedDate: 'Ausgewähltes Datum: {0}. {1}',
      selectedRange: 'Ausgewählter Zeitraum: {0} bis {1}. {2}',
    },
    presets: {
      today: 'Heute',
      yesterday: 'Gestern',
      last7Days: 'Letzte 7 Tage',
      last30Days: 'Letzte 30 Tage',
      thisMonth: 'Dieser Monat',
      lastMonth: 'Letzter Monat',
      thisQuarter: 'Dieses Quartal',
      lastQuarter: 'Letztes Quartal',
      yearToDate: 'Seit Jahresbeginn',
      lastYear: 'Letztes Jahr',
    },
    week: {
      short: 'KW',
    },
  },
}
