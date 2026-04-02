import { createApp } from 'vue'

import App from './App.vue'
import vuetify from './plugins/vuetify'

import { AdvancedDatePlugin } from 'vuetify-date-input-advanced'

createApp(App).use(vuetify).use(AdvancedDatePlugin).mount('#app')
