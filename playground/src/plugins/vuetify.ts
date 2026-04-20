import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

import { createVuetify } from 'vuetify'
import { cs, de, en, fr, it, lt } from 'vuetify/locale'

import {
  readPlaygroundLocalePreference,
  readThemeModePreference,
} from '../playgroundPreferences'

const initialLocale = readPlaygroundLocalePreference()
const initialThemeMode = readThemeModePreference()

export const vuetify = createVuetify({
  locale: {
    locale: initialLocale,
    fallback: 'en',
    messages: { cs, de, en, fr, it, lt },
  },
  date: {
    locale: {
      cs: 'cs-CZ',
      de: 'de-DE',
      en: 'en-US',
      fr: 'fr-FR',
      it: 'it-IT',
      lt: 'lt-LT',
    },
  },
  theme: {
    defaultTheme: initialThemeMode,
  },
})

export default vuetify
