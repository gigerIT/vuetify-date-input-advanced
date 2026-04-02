import type { App, Plugin } from 'vue'

import { VAdvancedDateInput } from '@/components/VAdvancedDateInput'
import { VAdvancedDatePicker } from '@/components/VAdvancedDatePicker'

export const AdvancedDatePlugin: Plugin = {
  install(app: App) {
    app.component(VAdvancedDatePicker.name!, VAdvancedDatePicker)
    app.component(VAdvancedDateInput.name!, VAdvancedDateInput)
  },
}

export default AdvancedDatePlugin
