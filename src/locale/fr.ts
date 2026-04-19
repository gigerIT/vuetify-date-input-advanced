import type { DateInputAdvancedLocaleMessages } from '@/types'

export const dateInputAdvancedFr: DateInputAdvancedLocaleMessages = {
  dateInputAdvanced: {
    actions: {
      apply: 'Appliquer',
      cancel: 'Annuler',
    },
    ariaLabel: {
      previousMonth: 'Mois précédent',
      nextMonth: 'Mois suivant',
    },
    errors: {
      invalidDate: 'Saisissez une date valide',
      unavailableDate: 'La date n’est pas disponible',
      invalidRange: 'Saisissez une plage de dates valide',
      unavailableRange: 'Une ou plusieurs dates ne sont pas disponibles',
    },
    live: {
      selectedDate: 'Date sélectionnée : {0}. {1}',
      selectedRange: 'Plage sélectionnée : {0} à {1}. {2}',
    },
    presets: {
      today: 'Aujourd’hui',
      yesterday: 'Hier',
      last7Days: '7 derniers jours',
      last30Days: '30 derniers jours',
      thisMonth: 'Ce mois-ci',
      lastMonth: 'Le mois dernier',
      thisQuarter: 'Ce trimestre',
      lastQuarter: 'Le trimestre dernier',
      yearToDate: 'Depuis le début de l’année',
      lastYear: 'L’année dernière',
    },
    week: {
      short: 'Sem.',
    },
  },
}
