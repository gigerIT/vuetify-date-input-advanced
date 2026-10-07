import type { DateInputAdvancedLocaleMessages } from '@/types'

export const dateInputAdvancedDe: DateInputAdvancedLocaleMessages = {
  dateInputAdvanced: {
    actions: {
      apply: 'Übernehmen',
      cancel: 'Abbrechen',
    },
    fields: {
      startDate: 'Startdatum',
      endDate: 'Enddatum',
    },
    ariaLabel: {
      previousMonth: 'Vorheriger Monat',
      nextMonth: 'Nächster Monat',
    },
    navigation: {
      unavailablePeriod: 'Keine verfügbaren Daten: {0}',
      searchLater: 'Spätere Daten suchen',
      searchedLater: 'Keine späteren Daten bis {0} gefunden',
      jumpToMonth: 'Zu {0} wechseln',
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
