import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

import { createVuetify } from 'vuetify'
import { de, en, fr, it } from 'vuetify/locale'

export const vuetify = createVuetify({
  locale: {
    locale: 'en',
    fallback: 'en',
    messages: { de, en, fr, it },
  },
  date: {
    locale: {
      de: 'de-DE',
      en: 'en-US',
      fr: 'fr-FR',
      it: 'it-IT',
    },
  },
  theme: {
    defaultTheme: 'system',
  },
})

export default vuetify
