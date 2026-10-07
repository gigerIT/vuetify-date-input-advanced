import type { DateInputAdvancedLocaleMessages } from '@/types'

export const dateInputAdvancedIt: DateInputAdvancedLocaleMessages = {
  dateInputAdvanced: {
    actions: {
      apply: 'Applica',
      cancel: 'Annulla',
    },
    fields: {
      startDate: 'Data di inizio',
      endDate: 'Data di fine',
    },
    ariaLabel: {
      previousMonth: 'Mese precedente',
      nextMonth: 'Mese successivo',
    },
    navigation: {
      unavailablePeriod: 'Nessuna data disponibile: {0}',
      searchEarlier: 'Cerca date precedenti',
      searchLater: 'Cerca date successive',
      searchedEarlier: 'Nessuna data precedente trovata fino a {0}',
      searchedLater: 'Nessuna data successiva trovata fino a {0}',
      jumpToMonth: 'Vai a {0}',
    },
    errors: {
      invalidDate: 'Inserisci una data valida',
      unavailableDate: 'La data non è disponibile',
      invalidRange: 'Inserisci un intervallo di date valido',
      unavailableRange: 'Una o più date non sono disponibili',
    },
    live: {
      selectedDate: 'Data selezionata: {0}. {1}',
      selectedRange: 'Intervallo selezionato: dal {0} al {1}. {2}',
    },
    presets: {
      today: 'Oggi',
      yesterday: 'Ieri',
      last7Days: 'Ultimi 7 giorni',
      last30Days: 'Ultimi 30 giorni',
      thisMonth: 'Questo mese',
      lastMonth: 'Mese scorso',
      thisQuarter: 'Questo trimestre',
      lastQuarter: 'Trimestre scorso',
      yearToDate: 'Da inizio anno',
      lastYear: 'Anno scorso',
    },
    week: {
      short: 'Sett.',
    },
  },
}
