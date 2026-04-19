import { mount, type MountingOptions } from '@vue/test-utils'

import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { de, en, fr, it } from 'vuetify/locale'

type TestLocale = 'de' | 'en' | 'fr' | 'it'

interface RenderOptions extends MountingOptions<any> {
  locale?: TestLocale
}

function createTestVuetify(locale: TestLocale = 'en') {
  return createVuetify({
    components,
    directives,
    locale: {
      locale,
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
  })
}

export function render(component: unknown, options: RenderOptions = {}) {
  const { locale = 'en', global, ...mountOptions } = options
  const vuetify = createTestVuetify(locale)

  return mount(component as any, {
    ...mountOptions,
    global: {
      ...global,
      plugins: [vuetify, ...(global?.plugins ?? [])],
      stubs: {
        transition: false,
        'transition-group': false,
        ...(global?.stubs ?? {}),
      },
    },
  })
}

export function renderWithVuetify(
  component: unknown,
  options: RenderOptions = {},
) {
  const { locale = 'en', global, ...mountOptions } = options
  const vuetify = createTestVuetify(locale)
  const wrapper = mount(component as any, {
    ...mountOptions,
    global: {
      ...global,
      plugins: [vuetify, ...(global?.plugins ?? [])],
      stubs: {
        transition: false,
        'transition-group': false,
        ...(global?.stubs ?? {}),
      },
    },
  })

  return {
    wrapper,
    vuetify,
  }
}
