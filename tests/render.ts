import { mount, type MountingOptions } from '@vue/test-utils'

import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

export function render(component: unknown, options: MountingOptions<any> = {}) {
  const vuetify = createVuetify({ components, directives })

  return mount(component as any, {
    ...options,
    global: {
      plugins: [vuetify],
      stubs: {
        transition: false,
        'transition-group': false,
      },
      ...options.global,
    },
  })
}
