import type { App, Plugin } from 'vue'
import { VAdvancedDateInput } from './components/VAdvancedDateInput'
import { VAdvancedDatePicker } from './components/VAdvancedDatePicker'

export interface AdvancedDateInputPluginOptions {
  /** Override component names for global registration */
  components?: {
    VAdvancedDateInput?: string
    VAdvancedDatePicker?: string
  }
}

export function createAdvancedDateInput(
  options: AdvancedDateInputPluginOptions = {},
): Plugin {
  return {
    install(app: App) {
      const names = options.components ?? {}
      app.component(names.VAdvancedDateInput ?? 'VAdvancedDateInput', VAdvancedDateInput)
      app.component(names.VAdvancedDatePicker ?? 'VAdvancedDatePicker', VAdvancedDatePicker)
    },
  }
}
