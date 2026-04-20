import { mount, type MountingOptions } from '@vue/test-utils'

import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { cs, de, en, fr, it, lt } from 'vuetify/locale'

type TestLocale = 'cs' | 'de' | 'en' | 'fr' | 'it' | 'lt'
type CreateVuetifyOptions = Parameters<typeof createVuetify>[0]

interface RenderOptions extends MountingOptions<any> {
  locale?: TestLocale
  vuetify?: CreateVuetifyOptions
}

function createTestVuetify(
  locale: TestLocale = 'en',
  options: CreateVuetifyOptions = {},
) {
  const defaultLocaleMessages = { cs, de, en, fr, it, lt }
  const defaultDateLocale = {
    cs: 'cs-CZ',
    de: 'de-DE',
    en: 'en-US',
    fr: 'fr-FR',
    it: 'it-IT',
    lt: 'lt-LT',
  }

  return createVuetify({
    components,
    directives,
    ...options,
    locale: {
      locale,
      fallback: 'en',
      ...options.locale,
      messages: {
        ...defaultLocaleMessages,
        ...(options.locale?.messages ?? {}),
      },
    },
    date: {
      ...options.date,
      locale: {
        ...defaultDateLocale,
        ...(options.date?.locale ?? {}),
      },
    },
  })
}

export function render(component: unknown, options: RenderOptions = {}) {
  const {
    locale = 'en',
    vuetify: vuetifyOptions,
    global,
    ...mountOptions
  } = options
  const vuetify = createTestVuetify(locale, vuetifyOptions)

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
  const {
    locale = 'en',
    vuetify: vuetifyOptions,
    global,
    ...mountOptions
  } = options
  const vuetify = createTestVuetify(locale, vuetifyOptions)
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
