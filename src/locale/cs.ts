import type { DateInputAdvancedLocaleMessages } from '@/types'

export const dateInputAdvancedCs: DateInputAdvancedLocaleMessages = {
  dateInputAdvanced: {
    actions: {
      apply: 'Použít',
      cancel: 'Zrušit',
    },
    fields: {
      startDate: 'Datum od',
      endDate: 'Datum do',
    },
    ariaLabel: {
      previousMonth: 'Předchozí měsíc',
      nextMonth: 'Následující měsíc',
    },
    errors: {
      invalidDate: 'Zadejte platné datum',
      unavailableDate: 'Datum není k dispozici',
      invalidRange: 'Zadejte platný rozsah dat',
      unavailableRange: 'Jedno nebo více dat není k dispozici',
    },
    live: {
      selectedDate: 'Vybrané datum: {0}. {1}',
      selectedRange: 'Vybraný rozsah: {0} až {1}. {2}',
    },
    presets: {
      today: 'Dnes',
      yesterday: 'Včera',
      last7Days: 'Posledních 7 dní',
      last30Days: 'Posledních 30 dní',
      thisMonth: 'Tento měsíc',
      lastMonth: 'Minulý měsíc',
      thisQuarter: 'Toto čtvrtletí',
      lastQuarter: 'Minulé čtvrtletí',
      yearToDate: 'Od začátku roku',
      lastYear: 'Minulý rok',
    },
    week: {
      short: 'Týd.',
    },
  },
}
