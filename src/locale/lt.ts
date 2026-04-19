import type { DateInputAdvancedLocaleMessages } from '@/types'

export const dateInputAdvancedLt: DateInputAdvancedLocaleMessages = {
  dateInputAdvanced: {
    actions: {
      apply: 'Taikyti',
      cancel: 'Atšaukti',
    },
    ariaLabel: {
      previousMonth: 'Ankstesnis mėnuo',
      nextMonth: 'Kitas mėnuo',
    },
    errors: {
      invalidDate: 'Įveskite tinkamą datą',
      unavailableDate: 'Datos pasirinkti negalima',
      invalidRange: 'Įveskite tinkamą datų intervalą',
      unavailableRange: 'Vienos ar kelių datų pasirinkti negalima',
    },
    live: {
      selectedDate: 'Pasirinkta data: {0}. {1}',
      selectedRange: 'Pasirinktas intervalas: nuo {0} iki {1}. {2}',
    },
    presets: {
      today: 'Šiandien',
      yesterday: 'Vakar',
      last7Days: 'Paskutinės 7 dienos',
      last30Days: 'Paskutinės 30 dienų',
      thisMonth: 'Šis mėnuo',
      lastMonth: 'Praėjęs mėnuo',
      thisQuarter: 'Šis ketvirtis',
      lastQuarter: 'Praėjęs ketvirtis',
      yearToDate: 'Nuo metų pradžios',
      lastYear: 'Praėję metai',
    },
    week: {
      short: 'Sav.',
    },
  },
}
