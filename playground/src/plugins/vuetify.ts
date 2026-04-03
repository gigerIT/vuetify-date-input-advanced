import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

import { createVuetify } from 'vuetify'
import { de, en, fr } from 'vuetify/locale'

export const vuetify = createVuetify({
  locale: {
    locale: 'en',
    fallback: 'en',
    messages: { de, en, fr },
  },
  date: {
    locale: {
      de: 'de-DE',
      en: 'en-US',
      fr: 'fr-FR',
    },
  },
  theme: {
    defaultTheme: 'system',
  },
})

export default vuetify
