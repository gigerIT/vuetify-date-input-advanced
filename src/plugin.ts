import type { App, Plugin } from 'vue'
import { VDateInputAdvanced } from '@/components/VDateInputAdvanced'
import { VDatePickerAdvanced } from '@/components/VDatePickerAdvanced'

export interface DateInputAdvancedPluginOptions {
  registerPicker?: boolean
}

export function createDateInputAdvanced(options: DateInputAdvancedPluginOptions = {}): Plugin {
  return {
    install(app: App) {
      app.component('VDateInputAdvanced', VDateInputAdvanced)

      if (options.registerPicker !== false) {
        app.component('VDatePickerAdvanced', VDatePickerAdvanced)
      }
    },
  }
}

export const DateInputAdvancedPlugin = createDateInputAdvanced()
