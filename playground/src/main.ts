import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/styles'
import App from './App.vue'
import DateInputAdvancedPlugin from '@gigerit/vuetify-date-input-advanced'
import '@gigerit/vuetify-date-input-advanced/styles'

const vuetify = createVuetify({
  components,
  directives,
  defaults: {
    VDateInputAdvanced: {
      months: 2,
      showPresets: true,
    },
  },
})

createApp(App).use(vuetify).use(DateInputAdvancedPlugin).mount('#app')
