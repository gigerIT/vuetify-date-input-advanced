import { flushPromises } from '@vue/test-utils'
import { h } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { aliases as mdAliases, md } from 'vuetify/iconsets/md'
import { aliases as mdiAliases, mdi as mdiClassSet } from 'vuetify/iconsets/mdi'
import {
  aliases as mdiSvgAliases,
  mdi as mdiSvgSet,
} from 'vuetify/iconsets/mdi-svg'

import { VAdvancedDateInput } from '@/components/VAdvancedDateInput'
import type {
  AdvancedDateInputClosePayload,
  AdvancedDateInputCommitPayload,
  AdvancedDateInputDraft,
  AdvancedDateInputInvalidPayload,
  AdvancedDateInputPublicInstance,
} from '@/types'

import { render, renderWithVuetify } from '../render'

const dialogStub = {
  name: 'VDialog',
  props: ['modelValue', 'fullscreen'],
  template: '<div><slot /></div>',
}

const menuStub = {
  name: 'VMenu',
  props: ['modelValue', 'closeOnContentClick', 'offset', 'minWidth'],
  template: '<div><slot name="activator" :props="{}" /><slot /></div>',
}

const inputIconCases = [
  {
    name: 'Material Icons',
    vuetify: {
      icons: {
        defaultSet: 'md',
        aliases: mdAliases,
        sets: { md },
      },
    },
    assertIcon: (wrapper: ReturnType<typeof render>) => {
      const appendInner = wrapper.find('.v-field__append-inner')

      expect(appendInner.html()).toContain('material-icons')
      expect(appendInner.text()).toContain('event')
    },
  },
  {
    name: 'Material Design Icons',
    vuetify: {
      icons: {
        defaultSet: 'mdi',
        aliases: mdiAliases,
        sets: { mdi: mdiClassSet },
      },
    },
    assertIcon: (wrapper: ReturnType<typeof render>) => {
      expect(wrapper.find('.v-field__append-inner').html()).toContain(
        'mdi-calendar',
      )
    },
  },
  {
    name: 'Material Design Icons SVG',
    vuetify: {
      icons: {
        defaultSet: 'mdi',
        aliases: mdiSvgAliases,
        sets: { mdi: mdiSvgSet },
      },
    },
    assertIcon: (wrapper: ReturnType<typeof render>) => {
      expect(
        wrapper.find('.v-field__append-inner svg.v-icon__svg').exists(),
      ).toBe(true)
    },
  },
] as const

const testFieldIcon = () => h('span', { class: 'test-field-icon' }, 'custom')

function toLocalYmd(date: Date | null | undefined) {
  if (!date) return null

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function allowOnly(...allowedDates: string[]) {
  const allowed = new Set(allowedDates)

  return (date: unknown) => {
    return date instanceof Date && allowed.has(toLocalYmd(date) ?? '')
  }
}

function monthLabels(wrapper: ReturnType<typeof render>) {
  return wrapper
    .findAll('.v-advanced-date-picker__month-label-text')
    .map((node) => node.text())
}

function lastEmitted<T>(
  wrapper: ReturnType<typeof render>,
  eventName: string,
): T | undefined {
  return wrapper.emitted(eventName)?.at(-1)?.[0] as T | undefined
}

function publicHandle(wrapper: ReturnType<typeof render>) {
  return wrapper.vm as unknown as AdvancedDateInputPublicInstance<Date>
}

function deferredValue<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve
  })

  return {
    promise,
    resolve,
  }
}

async function runWithDesktopWidth(
  callback: () => Promise<void> | void,
  width = 1440,
) {
  const originalWidth = window.innerWidth

  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })
  window.dispatchEvent(new Event('resize'))

  try {
    await callback()
  } finally {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: originalWidth,
    })
    window.dispatchEvent(new Event('resize'))
  }
}

describe('VAdvancedDateInput', () => {
  it.each(inputIconCases)(
    'renders the default calendar icon with $name',
    async ({ vuetify, assertIcon }) => {
      await runWithDesktopWidth(() => {
        const wrapper = render(VAdvancedDateInput, {
          props: {
            modelValue: null,
          },
          global: {
            stubs: {
              VMenu: menuStub,
            },
          },
          vuetify,
        })

        try {
          assertIcon(wrapper)
        } finally {
          wrapper.unmount()
        }
      })
    },
  )

  it('forwards navigation icon overrides to the internal picker', async () => {
    await runWithDesktopWidth(() => {
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: null,
          month: 0,
          year: 2026,
          prevIcon: 'mdi:mdi-minus',
          nextIcon: 'mdi:mdi-plus',
        },
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
        vuetify: {
          icons: {
            defaultSet: 'md',
            aliases: mdAliases,
            sets: {
              md,
              mdi: mdiClassSet,
            },
          },
        },
      })

      try {
        expect(
          wrapper.find('button[aria-label="Previous month"]').html(),
        ).toContain('mdi-minus')
        expect(
          wrapper.find('button[aria-label="Next month"]').html(),
        ).toContain('mdi-plus')
      } finally {
        wrapper.unmount()
      }
    })
  })

  it('renders disabled constrained navigation buttons through the input wrapper', async () => {
    await runWithDesktopWidth(() => {
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: null,
          month: 1,
          year: 2026,
          months: 1,
          allowedDates: allowOnly('2026-01-15', '2026-02-05'),
        },
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      try {
        expect(
          wrapper.find('button[aria-label="Previous month"]').attributes(
            'disabled',
          ),
        ).toBeUndefined()
        expect(
          wrapper.find('button[aria-label="Next month"]').attributes(
            'disabled',
          ),
        ).toBeDefined()
      } finally {
        wrapper.unmount()
      }
    })
  })

  it('accepts component icon values for field icon overrides', async () => {
    await runWithDesktopWidth(() => {
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: null,
          prependInnerIcon: testFieldIcon,
          appendInnerIcon: testFieldIcon,
        },
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      try {
        expect(wrapper.findAll('.test-field-icon')).toHaveLength(2)
      } finally {
        wrapper.unmount()
      }
    })
  })

  it('forwards the optional title to the desktop picker', () => {
    const originalWidth = window.innerWidth

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1440,
    })
    window.dispatchEvent(new Event('resize'))

    let wrapper: ReturnType<typeof render> | null = null

    try {
      wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: null,
          title: 'Departure Date',
        },
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      expect(wrapper.find('.v-advanced-date-picker__title').text()).toBe(
        'Departure Date',
      )
    } finally {
      wrapper?.unmount()

      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        writable: true,
        value: originalWidth,
      })
      window.dispatchEvent(new Event('resize'))
    }
  })

  it('forwards range-specific titles to the desktop picker', () => {
    const originalWidth = window.innerWidth

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1440,
    })
    window.dispatchEvent(new Event('resize'))

    let wrapper: ReturnType<typeof render> | null = null

    try {
      wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: null,
          title: 'Travel dates',
          titleStartDate: 'Departure Date',
          titleEndDate: 'Return Date',
        },
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      expect(wrapper.find('.v-advanced-date-picker__title').text()).toBe(
        'Departure Date',
      )
    } finally {
      wrapper?.unmount()

      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        writable: true,
        value: originalWidth,
      })
      window.dispatchEvent(new Event('resize'))
    }
  })

  it('uses a fullscreen dialog on mobile', () => {
    const originalWidth = window.innerWidth

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 375,
    })
    window.dispatchEvent(new Event('resize'))

    let wrapper: ReturnType<typeof render> | null = null

    try {
      wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: null,
        },
        attachTo: document.body,
      })

      const dialog = wrapper.findComponent({ name: 'VDialog' })

      expect(dialog.exists()).toBe(true)
      expect(dialog.props('fullscreen')).toBe(true)
    } finally {
      wrapper?.unmount()

      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        writable: true,
        value: originalWidth,
      })
      window.dispatchEvent(new Event('resize'))
    }
  })

  it('forwards the optional title to the mobile fullscreen picker', () => {
    const originalWidth = window.innerWidth

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 375,
    })
    window.dispatchEvent(new Event('resize'))

    let wrapper: ReturnType<typeof render> | null = null

    try {
      wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: null,
          title: 'Departure Date',
        },
        global: {
          stubs: {
            VDialog: dialogStub,
          },
        },
      })

      expect(wrapper.find('.v-advanced-date-picker__title').text()).toBe(
        'Departure Date',
      )
    } finally {
      wrapper?.unmount()

      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        writable: true,
        value: originalWidth,
      })
      window.dispatchEvent(new Event('resize'))
    }
  })

  it('forwards range-specific titles to the mobile fullscreen picker', () => {
    const originalWidth = window.innerWidth

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 375,
    })
    window.dispatchEvent(new Event('resize'))

    let wrapper: ReturnType<typeof render> | null = null

    try {
      wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: null,
          title: 'Travel dates',
          titleStartDate: 'Departure Date',
          titleEndDate: 'Return Date',
        },
        global: {
          stubs: {
            VDialog: dialogStub,
          },
        },
      })

      expect(wrapper.find('.v-advanced-date-picker__title').text()).toBe(
        'Departure Date',
      )
    } finally {
      wrapper?.unmount()

      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        writable: true,
        value: originalWidth,
      })
      window.dispatchEvent(new Event('resize'))
    }
  })

  it('emits update:menu when the mobile dialog closes itself', async () => {
    const originalWidth = window.innerWidth

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 375,
    })
    window.dispatchEvent(new Event('resize'))

    let wrapper: ReturnType<typeof render> | null = null

    try {
      wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: null,
          menu: true,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VDialog: dialogStub,
          },
        },
      })

      const dialog = wrapper.findComponent({ name: 'VDialog' })

      dialog.vm.$emit('update:modelValue', false)
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('update:menu')?.at(-1)).toEqual([false])
    } finally {
      wrapper?.unmount()

      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        writable: true,
        value: originalWidth,
      })
      window.dispatchEvent(new Event('resize'))
    }
  })

  it('renders a windowed month list without nav buttons in mobile fullscreen mode', async () => {
    const originalWidth = window.innerWidth

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 375,
    })
    window.dispatchEvent(new Event('resize'))

    let wrapper: ReturnType<typeof render> | null = null

    try {
      wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: null,
          menu: true,
          months: 2,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VDialog: dialogStub,
          },
        },
      })

      await wrapper.vm.$nextTick()

      const picker = wrapper.find('.v-advanced-date-picker')

      expect(picker.classes()).toContain(
        'v-advanced-date-picker--mobile-fullscreen',
      )
      expect(picker.classes()).toContain(
        'v-advanced-date-picker--mobile-scroll',
      )
      expect(wrapper.find('button[aria-label="Previous month"]').exists()).toBe(
        false,
      )
      expect(wrapper.find('button[aria-label="Next month"]').exists()).toBe(
        false,
      )
      expect(
        wrapper.findAll('.v-advanced-date-picker__month').length,
      ).toBeGreaterThan(2)
    } finally {
      wrapper?.unmount()

      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        writable: true,
        value: originalWidth,
      })
      window.dispatchEvent(new Event('resize'))
    }
  })

  it('renders a windowed month list without nav buttons in mobile inline mode', async () => {
    const originalWidth = window.innerWidth

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 375,
    })
    window.dispatchEvent(new Event('resize'))

    let wrapper: ReturnType<typeof render> | null = null

    try {
      wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: null,
          inline: true,
          months: 2,
        },
        attachTo: document.body,
      })

      await wrapper.vm.$nextTick()

      const picker = wrapper.find('.v-advanced-date-picker')

      expect(picker.classes()).not.toContain(
        'v-advanced-date-picker--mobile-fullscreen',
      )
      expect(picker.classes()).toContain(
        'v-advanced-date-picker--mobile-scroll',
      )
      expect(wrapper.find('button[aria-label="Previous month"]').exists()).toBe(
        false,
      )
      expect(wrapper.find('button[aria-label="Next month"]').exists()).toBe(
        false,
      )
      expect(
        wrapper.findAll('.v-advanced-date-picker__month').length,
      ).toBeGreaterThan(2)
    } finally {
      wrapper?.unmount()

      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        writable: true,
        value: originalWidth,
      })
      window.dispatchEvent(new Event('resize'))
    }
  })

  it('limits mobile fullscreen input rendering to the constrained month segment', async () => {
    await runWithDesktopWidth(async () => {
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: null,
          menu: true,
          month: 1,
          year: 2026,
          months: 1,
          allowedDates: allowOnly('2026-02-10', '2026-04-10'),
        },
        attachTo: document.body,
        global: {
          stubs: {
            VDialog: dialogStub,
          },
        },
      })

      try {
        await wrapper.vm.$nextTick()

        expect(monthLabels(wrapper)).toEqual(['February 2026'])
      } finally {
        wrapper.unmount()
      }
    }, 375)
  })

  it('parses a typed range and emits the normalized tuple on enter', async () => {
    const wrapper = render(VAdvancedDateInput, {
      props: {
        modelValue: null,
        month: 0,
        year: 2026,
      },
      attachTo: document.body,
    })

    const input = wrapper.find('input')

    await input.setValue('Jan 12, 2026 - Jan 19, 2026')
    await input.trigger('keydown', { key: 'Enter' })

    const emissions = wrapper.emitted('update:modelValue') ?? []
    const finalValue = emissions.at(-1)?.[0] as [Date | null, Date | null]

    expect(finalValue[0]).toBeInstanceOf(Date)
    expect(finalValue[1]).toBeInstanceOf(Date)

    wrapper.unmount()
  })

  it('disables browser autocomplete on the text input', () => {
    const wrapper = render(VAdvancedDateInput, {
      props: {
        modelValue: null,
      },
    })

    expect(wrapper.find('input').attributes('autocomplete')).toBe('off')

    wrapper.unmount()
  })

  it('forwards attrs to the desktop input field', () => {
    const originalWidth = window.innerWidth

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1440,
    })
    window.dispatchEvent(new Event('resize'))

    let wrapper: ReturnType<typeof render> | null = null

    try {
      wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: null,
        },
        attrs: {
          id: 'travel-dates',
          name: 'travelDates',
          'aria-label': 'Travel dates input',
        },
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      const input = wrapper.find('input')

      expect(input.attributes('id')).toBe('travel-dates')
      expect(input.attributes('name')).toBe('travelDates')
      expect(input.attributes('aria-label')).toBe('Travel dates input')
    } finally {
      wrapper?.unmount()

      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        writable: true,
        value: originalWidth,
      })
      window.dispatchEvent(new Event('resize'))
    }
  })

  it('forwards attrs to the mobile input field', () => {
    const originalWidth = window.innerWidth

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 375,
    })
    window.dispatchEvent(new Event('resize'))

    let wrapper: ReturnType<typeof render> | null = null

    try {
      wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: null,
        },
        attrs: {
          id: 'travel-dates-mobile',
          name: 'travelDatesMobile',
          'aria-label': 'Travel dates mobile input',
        },
        global: {
          stubs: {
            VDialog: dialogStub,
          },
        },
      })

      const input = wrapper.find('input')

      expect(input.attributes('id')).toBe('travel-dates-mobile')
      expect(input.attributes('name')).toBe('travelDatesMobile')
      expect(input.attributes('aria-label')).toBe('Travel dates mobile input')
      expect(
        wrapper.find('.v-advanced-date-input-shell').attributes('id'),
      ).toBeUndefined()
    } finally {
      wrapper?.unmount()

      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        writable: true,
        value: originalWidth,
      })
      window.dispatchEvent(new Event('resize'))
    }
  })

  it('forwards blur hooks while keeping typed drafts pending', async () => {
    const onBlur = vi.fn()
    const wrapper = render(VAdvancedDateInput, {
      props: {
        modelValue: null,
        range: false,
        month: 0,
        year: 2026,
      },
      attrs: {
        onBlur,
      },
      attachTo: document.body,
    })

    const input = wrapper.find('input')

    await input.setValue('Jan 12, 2026')
    await input.trigger('blur')
    await flushPromises()

    const currentDraft = publicHandle(wrapper).draft

    expect(onBlur).toHaveBeenCalledTimes(1)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(currentDraft.source).toBe('text')
    expect(currentDraft.parseStatus).toBe('complete')
    expect(toLocalYmd(currentDraft.selection.start)).toBe('2026-01-12')

    wrapper.unmount()
  })

  it('forwards keydown hooks without breaking enter handling', async () => {
    const onKeydown = vi.fn()
    const wrapper = render(VAdvancedDateInput, {
      props: {
        modelValue: null,
      },
      attrs: {
        onKeydown,
      },
      attachTo: document.body,
    })

    const input = wrapper.find('input')

    await input.trigger('keydown', { key: 'Enter' })

    expect(onKeydown).toHaveBeenCalledTimes(1)
    expect(wrapper.emitted('update:menu')?.at(-1)).toEqual([true])

    wrapper.unmount()
  })

  it('rolls back an optimistic Enter open when async field rules fail', async () => {
    const deferredRule = deferredValue<true | string>()
    const asyncRule = vi.fn(async () => await deferredRule.promise)
    const wrapper = render(VAdvancedDateInput, {
      props: {
        modelValue: null,
        range: false,
        rules: [asyncRule],
      },
      attachTo: document.body,
    })

    const input = wrapper.find('input')

    await input.setValue('Jan 12, 2026')
    await input.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('update:menu')).toEqual([[true]])
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()

    deferredRule.resolve('Async required')
    await flushPromises()

    const payload = lastEmitted<AdvancedDateInputInvalidPayload<Date>>(
      wrapper,
      'inputInvalid',
    )

    expect(wrapper.emitted('update:menu')).toEqual([[true], [false]])
    expect(payload?.reason).toBe('rule')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.text()).toContain('Async required')

    wrapper.unmount()
  })

  it('opens the overlay from Enter without parsing when inputReadonly is enabled', async () => {
    const originalWidth = window.innerWidth

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1440,
    })
    window.dispatchEvent(new Event('resize'))

    let wrapper: ReturnType<typeof render> | null = null

    try {
      wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: null,
          inputReadonly: true,
          range: false,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      const input = wrapper.find('input')

      expect(input.attributes('readonly')).toBeDefined()

      await input.setValue('not a date')
      await input.trigger('keydown', { key: 'Enter' })
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(wrapper.emitted('update:menu')?.at(-1)).toEqual([true])
      expect(wrapper.text()).not.toContain('Enter a valid date')
    } finally {
      wrapper?.unmount()

      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        writable: true,
        value: originalWidth,
      })
      window.dispatchEvent(new Event('resize'))
    }
  })

  it('still opens the overlay from the field and append icon when inputReadonly is enabled', async () => {
    const originalWidth = window.innerWidth

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1440,
    })
    window.dispatchEvent(new Event('resize'))

    let wrapper: ReturnType<typeof render> | null = null

    try {
      wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: null,
          inputReadonly: true,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      const field = wrapper.findComponent({ name: 'VTextField' })

      field.vm.$emit('click:control', new MouseEvent('click'))
      await wrapper.vm.$nextTick()

      field.vm.$emit('click:appendInner', new MouseEvent('click'))
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('update:menu')).toEqual([[true], [true]])
    } finally {
      wrapper?.unmount()

      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        writable: true,
        value: originalWidth,
      })
      window.dispatchEvent(new Event('resize'))
    }
  })

  it('keeps picker selection interactive when inputReadonly is enabled', async () => {
    const originalWidth = window.innerWidth

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1440,
    })
    window.dispatchEvent(new Event('resize'))

    let wrapper: ReturnType<typeof render> | null = null

    try {
      wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: null,
          inputReadonly: true,
          range: false,
          month: 0,
          year: 2026,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      await wrapper.find('[data-date="2026-01-12"]').trigger('click')

      const emissions = wrapper.emitted('update:modelValue') ?? []
      const finalValue = emissions.at(-1)?.[0] as Date | null

      expect(finalValue).toBeInstanceOf(Date)

      await wrapper.setProps({ modelValue: finalValue })
      await wrapper.vm.$nextTick()

      expect(wrapper.find('input').element.value).toBe('Jan 12, 2026')
    } finally {
      wrapper?.unmount()

      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        writable: true,
        value: originalWidth,
      })
      window.dispatchEvent(new Event('resize'))
    }
  })

  it('keeps apply actions available when inputReadonly is enabled', async () => {
    const originalWidth = window.innerWidth

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1440,
    })
    window.dispatchEvent(new Event('resize'))

    let wrapper: ReturnType<typeof render> | null = null

    try {
      wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: null,
          inputReadonly: true,
          autoApply: false,
          range: false,
          month: 0,
          year: 2026,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      expect(wrapper.text()).toContain('Apply')
      expect(wrapper.text()).toContain('Cancel')

      await wrapper.find('[data-date="2026-01-12"]').trigger('click')

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()

      const applyButton = wrapper
        .findAll('button')
        .find((button) => button.text() === 'Apply')

      expect(applyButton).toBeDefined()

      await applyButton!.trigger('click')

      const emissions = wrapper.emitted('update:modelValue') ?? []
      const finalValue = emissions.at(-1)?.[0] as Date | null

      expect(finalValue).toBeInstanceOf(Date)
      expect(wrapper.emitted('update:menu')?.at(-1)).toEqual([false])
    } finally {
      wrapper?.unmount()

      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        writable: true,
        value: originalWidth,
      })
      window.dispatchEvent(new Event('resize'))
    }
  })

  it('keeps the desktop apply menu open on synchronous validation failures', async () => {
    await runWithDesktopWidth(async () => {
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: [
            new Date('2026-01-12T00:00:00.000Z'),
            new Date('2026-01-19T00:00:00.000Z'),
          ],
          autoApply: false,
          menu: true,
          month: 0,
          year: 2026,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      await wrapper.find('[data-date="2026-01-20"]').trigger('click')
      await wrapper.vm.$nextTick()

      const applyButton = wrapper
        .findAll('button')
        .find((button) => button.text() === 'Apply')

      expect(applyButton).toBeDefined()

      await applyButton!.trigger('click')

      const payload = lastEmitted<AdvancedDateInputInvalidPayload<Date>>(
        wrapper,
        'inputInvalid',
      )

      expect(wrapper.emitted('update:menu')).toBeUndefined()
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(payload?.reason).toBe('incomplete')
      expect(wrapper.text()).toContain('Enter a valid date range')

      wrapper.unmount()
    })
  })

  it('rolls back the optimistic desktop Apply close when async field rules fail', async () => {
    const deferredRule = deferredValue<true | string>()
    const asyncRule = vi.fn(async () => await deferredRule.promise)

    await runWithDesktopWidth(async () => {
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: null,
          autoApply: false,
          menu: true,
          range: false,
          month: 0,
          year: 2026,
          rules: [asyncRule],
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      await wrapper.find('[data-date="2026-01-12"]').trigger('click')
      await wrapper.vm.$nextTick()

      const applyButton = wrapper
        .findAll('button')
        .find((button) => button.text() === 'Apply')

      expect(applyButton).toBeDefined()

      await applyButton!.trigger('click')

      expect(wrapper.emitted('update:menu')).toEqual([[false]])
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(wrapper.emitted('apply')).toBeUndefined()

      deferredRule.resolve('Async required')
      await flushPromises()

      const payload = lastEmitted<AdvancedDateInputInvalidPayload<Date>>(
        wrapper,
        'inputInvalid',
      )

      expect(wrapper.emitted('update:menu')).toEqual([[false], [true]])
      expect(payload?.reason).toBe('rule')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(wrapper.emitted('apply')).toBeUndefined()
      expect(wrapper.text()).toContain('Async required')

      wrapper.unmount()
    })
  })

  it('forwards clear hooks without breaking the internal clear flow', async () => {
    const onClickClear = vi.fn()
    const wrapper = render(VAdvancedDateInput, {
      props: {
        modelValue: new Date('2026-01-12T00:00:00.000Z'),
        menu: true,
        range: false,
        clearable: true,
      },
      attrs: {
        'onClick:clear': onClickClear,
      },
      attachTo: document.body,
      global: {
        stubs: {
          VDialog: dialogStub,
        },
      },
    })

    wrapper
      .findComponent({ name: 'VTextField' })
      .vm.$emit('click:clear', new MouseEvent('click'))
    await wrapper.vm.$nextTick()
    await flushPromises()

    expect(onClickClear).toHaveBeenCalledTimes(1)
    expect(wrapper.find('input').element.value).toBe('')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([null])
    expect(wrapper.emitted('update:menu')?.at(-1)).toEqual([false])

    wrapper.unmount()
  })

  it('keeps clearable support when inputReadonly is enabled', async () => {
    const originalWidth = window.innerWidth

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1440,
    })
    window.dispatchEvent(new Event('resize'))

    let wrapper: ReturnType<typeof render> | null = null

    try {
      wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: new Date('2026-01-12T00:00:00.000Z'),
          menu: true,
          inputReadonly: true,
          range: false,
          clearable: true,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      wrapper
        .findComponent({ name: 'VTextField' })
        .vm.$emit('click:clear', new MouseEvent('click'))
      await wrapper.vm.$nextTick()
      await flushPromises()

      expect(wrapper.find('input').element.value).toBe('')
      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([null])
      expect(wrapper.emitted('update:menu')?.at(-1)).toEqual([false])
    } finally {
      wrapper?.unmount()

      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        writable: true,
        value: originalWidth,
      })
      window.dispatchEvent(new Event('resize'))
    }
  })

  it('clears the committed model even when field rules reject empty values', async () => {
    await runWithDesktopWidth(async () => {
      const requiredRule = vi.fn((value: string) => !!value || 'Required')
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: new Date('2026-01-12T00:00:00.000Z'),
          menu: true,
          range: false,
          clearable: true,
          rules: [requiredRule],
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      wrapper
        .findComponent({ name: 'VTextField' })
        .vm.$emit('click:clear', new MouseEvent('click'))
      await wrapper.vm.$nextTick()
      await flushPromises()

      const commitPayload = lastEmitted<AdvancedDateInputCommitPayload<Date>>(
        wrapper,
        'inputCommit',
      )

      expect(wrapper.find('input').element.value).toBe('')
      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([null])
      expect(wrapper.emitted('update:menu')?.at(-1)).toEqual([false])
      expect(wrapper.emitted('inputInvalid')).toBeUndefined()
      expect(commitPayload?.value).toBeNull()

      wrapper.unmount()
    })
  })

  it('emits a single update:text event when a controlled field is cleared', async () => {
    await runWithDesktopWidth(async () => {
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: new Date('2026-01-12T00:00:00.000Z'),
          text: 'Jan 12, 2026',
          menu: true,
          range: false,
          clearable: true,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      const updateTextCount = wrapper.emitted('update:text')?.length ?? 0

      wrapper
        .findComponent({ name: 'VTextField' })
        .vm.$emit('click:clear', new MouseEvent('click'))
      await wrapper.vm.$nextTick()
      await flushPromises()

      expect(wrapper.emitted('update:text')?.length ?? 0).toBe(
        updateTextCount + 1,
      )
      expect(wrapper.emitted('update:text')?.at(-1)).toEqual([''])
      expect(wrapper.find('input').element.value).toBe('')
      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([null])

      wrapper.unmount()
    })
  })

  it('keeps attrs on the picker root in inline mode', () => {
    const wrapper = render(VAdvancedDateInput, {
      props: {
        modelValue: null,
        inline: true,
      },
      attrs: {
        id: 'inline-picker',
        'data-testid': 'inline-picker',
      },
    })

    const picker = wrapper.find('.v-advanced-date-picker')

    expect(wrapper.find('input').exists()).toBe(false)
    expect(picker.attributes('id')).toBe('inline-picker')
    expect(picker.attributes('data-testid')).toBe('inline-picker')

    wrapper.unmount()
  })

  it('leaves custom activator slots responsible for their own attrs', async () => {
    const originalWidth = window.innerWidth

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1440,
    })
    window.dispatchEvent(new Event('resize'))

    let wrapper: ReturnType<typeof render> | null = null

    try {
      wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: null,
        },
        attrs: {
          id: 'slot-owned-id',
          name: 'slotOwnedName',
        },
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
        slots: {
          activator: ({ props, isOpen }: any) =>
            h(
              'button',
              {
                ...props,
                type: 'button',
                'data-open': String(isOpen),
              },
              'Open picker',
            ),
        },
      })

      const button = wrapper.find('button')

      expect(button.attributes('id')).toBeUndefined()

      await button.trigger('click')

      expect(wrapper.emitted('update:menu')?.at(-1)).toEqual([true])
    } finally {
      wrapper?.unmount()

      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        writable: true,
        value: originalWidth,
      })
      window.dispatchEvent(new Event('resize'))
    }
  })

  it('forwards firstDayOfWeek to the inline picker', () => {
    const wrapper = render(VAdvancedDateInput, {
      props: {
        modelValue: null,
        inline: true,
        months: 1,
        month: 0,
        year: 2026,
        firstDayOfWeek: 1,
      },
    })

    expect(wrapper.findAll('.v-advanced-date-picker__weekday')[0].text()).toBe(
      'M',
    )
  })

  it('does not force the menu overlay to match the activator width', () => {
    const originalWidth = window.innerWidth

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1440,
    })
    window.dispatchEvent(new Event('resize'))

    let wrapper: ReturnType<typeof render> | null = null

    try {
      wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: null,
        },
      })

      const menu = wrapper.findComponent({ name: 'VMenu' })

      expect(menu.exists()).toBe(true)
      expect(menu.props('minWidth')).toBe(0)
    } finally {
      wrapper?.unmount()

      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        writable: true,
        value: originalWidth,
      })
      window.dispatchEvent(new Event('resize'))
    }
  })

  it('emits update:menu when the desktop menu closes itself', async () => {
    const originalWidth = window.innerWidth

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1440,
    })
    window.dispatchEvent(new Event('resize'))

    let wrapper: ReturnType<typeof render> | null = null

    try {
      wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: null,
          menu: true,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      const menu = wrapper.findComponent({ name: 'VMenu' })

      menu.vm.$emit('update:modelValue', false)
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('update:menu')?.at(-1)).toEqual([false])
    } finally {
      wrapper?.unmount()

      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        writable: true,
        value: originalWidth,
      })
      window.dispatchEvent(new Event('resize'))
    }
  })

  it('routes controlled menu=false through closeDraftStrategy="revert"', async () => {
    await runWithDesktopWidth(async () => {
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: [
            new Date('2026-01-12T00:00:00.000Z'),
            new Date('2026-01-19T00:00:00.000Z'),
          ],
          closeDraftStrategy: 'revert',
          menu: true,
          month: 0,
          year: 2026,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      await wrapper.find('[data-date="2026-01-20"]').trigger('click')
      await wrapper.vm.$nextTick()

      await wrapper.setProps({ menu: false })
      await flushPromises()

      const payload = lastEmitted<AdvancedDateInputClosePayload<Date>>(
        wrapper,
        'draftClose',
      )

      expect(wrapper.find('input').element.value).toBe(
        'Jan 12, 2026 – Jan 19, 2026',
      )
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(wrapper.emitted('update:menu')).toBeUndefined()
      expect(payload?.reason).toBe('dismiss')
      expect(payload?.strategy).toBe('revert')
      expect(payload?.outcome).toBe('closed')
      expect(toLocalYmd(payload?.draft.selection.start)).toBe('2026-01-20')
      expect(payload?.draft.selection.end).toBeNull()

      wrapper.unmount()
    })
  })

  it('routes controlled menu=false through closeDraftStrategy="commit" for complete drafts', async () => {
    await runWithDesktopWidth(async () => {
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: null,
          range: false,
          autoApply: false,
          closeDraftStrategy: 'commit',
          menu: true,
          month: 0,
          year: 2026,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      await wrapper.find('[data-date="2026-01-12"]').trigger('click')
      await wrapper.vm.$nextTick()

      await wrapper.setProps({ menu: false })
      await flushPromises()

      const value = lastEmitted<Date | null>(wrapper, 'update:modelValue')
      const commitPayload = lastEmitted<AdvancedDateInputCommitPayload<Date>>(
        wrapper,
        'inputCommit',
      )
      const closePayload = lastEmitted<AdvancedDateInputClosePayload<Date>>(
        wrapper,
        'draftClose',
      )

      expect(value).toBeInstanceOf(Date)
      expect(toLocalYmd(value)).toBe('2026-01-12')
      expect(wrapper.emitted('update:menu')).toBeUndefined()
      expect(closePayload?.reason).toBe('dismiss')
      expect(closePayload?.strategy).toBe('commit')
      expect(closePayload?.outcome).toBe('closed')
      expect(toLocalYmd(commitPayload?.draft.selection.start)).toBe(
        '2026-01-12',
      )
      expect(commitPayload?.draft.selection.end).toBeNull()

      wrapper.unmount()
    })
  })

  it('reopens controlled overlays when external menu=false is blocked by closeDraftStrategy="commit"', async () => {
    await runWithDesktopWidth(async () => {
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: [
            new Date('2026-01-12T00:00:00.000Z'),
            new Date('2026-01-19T00:00:00.000Z'),
          ],
          autoApply: false,
          closeDraftStrategy: 'commit',
          menu: true,
          month: 0,
          year: 2026,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      await wrapper.find('[data-date="2026-01-20"]').trigger('click')
      await wrapper.vm.$nextTick()

      await wrapper.setProps({ menu: false })
      await flushPromises()

      const invalidPayload = lastEmitted<AdvancedDateInputInvalidPayload<Date>>(
        wrapper,
        'inputInvalid',
      )
      const closePayload = lastEmitted<AdvancedDateInputClosePayload<Date>>(
        wrapper,
        'draftClose',
      )

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(wrapper.emitted('update:menu')).toEqual([[true]])
      expect(invalidPayload?.reason).toBe('incomplete')
      expect(closePayload?.reason).toBe('dismiss')
      expect(closePayload?.strategy).toBe('commit')
      expect(closePayload?.outcome).toBe('blocked')
      expect(wrapper.find('input').element.value).toBe('Jan 20, 2026')

      wrapper.unmount()
    })
  })

  it('shows an error for invalid typed ranges', async () => {
    const wrapper = render(VAdvancedDateInput, {
      props: {
        modelValue: null,
      },
      attachTo: document.body,
    })

    const input = wrapper.find('input')

    await input.setValue('not a range')
    await input.trigger('keydown', { key: 'Enter' })
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('update:menu')).toBeUndefined()
    expect(wrapper.text()).toContain('Enter a valid date range')

    wrapper.unmount()
  })

  it('updates typed input errors when the locale changes at runtime', async () => {
    const { wrapper, vuetify } = renderWithVuetify(VAdvancedDateInput, {
      props: {
        modelValue: null,
        month: 0,
        year: 2026,
      },
      attachTo: document.body,
    })

    const input = wrapper.find('input')

    await input.setValue('not a range')
    await input.trigger('blur')
    await flushPromises()

    expect(wrapper.text()).toContain('Enter a valid date range')
    ;(vuetify as any).locale.current.value = 'cs'
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Zadejte platný rozsah dat')

    wrapper.unmount()
  })

  it('rejects typed dates that fall outside constraints', async () => {
    const wrapper = render(VAdvancedDateInput, {
      props: {
        modelValue: null,
        range: false,
        min: new Date('2026-01-05T00:00:00.000Z'),
        max: new Date('2026-01-20T00:00:00.000Z'),
      },
      attachTo: document.body,
    })

    const input = wrapper.find('input')

    await input.setValue('Jan 30, 2026')
    await input.trigger('keydown', { key: 'Enter' })
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('update:menu')).toBeUndefined()
    expect(wrapper.text()).toContain('Date is unavailable')

    wrapper.unmount()
  })

  it('applies allowedStartDates to typed single dates', async () => {
    const wrapper = render(VAdvancedDateInput, {
      props: {
        modelValue: null,
        range: false,
        allowedStartDates: allowOnly('2026-01-12'),
      },
      attachTo: document.body,
    })

    const input = wrapper.find('input')

    await input.setValue('Jan 13, 2026')
    await input.trigger('keydown', { key: 'Enter' })
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.text()).toContain('Date is unavailable')

    wrapper.unmount()
  })

  it('rejects typed ranges when the ordered start is unavailable', async () => {
    const wrapper = render(VAdvancedDateInput, {
      props: {
        modelValue: null,
        allowedStartDates: allowOnly('2026-01-13'),
        allowedEndDates: allowOnly('2026-01-19'),
      },
      attachTo: document.body,
    })

    const input = wrapper.find('input')

    await input.setValue('Jan 19, 2026 - Jan 12, 2026')
    await input.trigger('keydown', { key: 'Enter' })
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.text()).toContain('One or more dates are unavailable')

    wrapper.unmount()
  })

  it('rejects typed ranges when the ordered end is unavailable', async () => {
    const wrapper = render(VAdvancedDateInput, {
      props: {
        modelValue: null,
        allowedStartDates: allowOnly('2026-01-12'),
        allowedEndDates: allowOnly('2026-01-18'),
      },
      attachTo: document.body,
    })

    const input = wrapper.find('input')

    await input.setValue('Jan 12, 2026 - Jan 19, 2026')
    await input.trigger('keydown', { key: 'Enter' })
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.text()).toContain('One or more dates are unavailable')

    wrapper.unmount()
  })

  it('accepts reversed typed ranges when the ordered endpoints are allowed', async () => {
    const wrapper = render(VAdvancedDateInput, {
      props: {
        modelValue: null,
        allowedStartDates: allowOnly('2026-01-12'),
        allowedEndDates: allowOnly('2026-01-19'),
      },
      attachTo: document.body,
    })

    const input = wrapper.find('input')

    await input.setValue('Jan 19, 2026 - Jan 12, 2026')
    await input.trigger('keydown', { key: 'Enter' })

    const emissions = wrapper.emitted('update:modelValue') ?? []
    const finalValue = emissions.at(-1)?.[0] as [Date | null, Date | null]

    expect(toLocalYmd(finalValue[0])).toBe('2026-01-12')
    expect(toLocalYmd(finalValue[1])).toBe('2026-01-19')

    wrapper.unmount()
  })

  it('keeps the first auto-apply range click as draft-only state in the input wrapper', async () => {
    await runWithDesktopWidth(async () => {
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: [
            new Date('2026-01-12T00:00:00.000Z'),
            new Date('2026-01-19T00:00:00.000Z'),
          ],
          autoApply: true,
          menu: true,
          month: 0,
          year: 2026,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      await wrapper.find('[data-date="2026-01-20"]').trigger('click')
      await wrapper.vm.$nextTick()

      const draft = lastEmitted<AdvancedDateInputDraft<Date>>(
        wrapper,
        'update:draft',
      )

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(wrapper.emitted('inputCommit')).toBeUndefined()
      expect(draft?.source).toBe('picker')
      expect(draft?.parseStatus).toBe('partial')
      expect(toLocalYmd(draft?.selection.start)).toBe('2026-01-20')
      expect(draft?.selection.end).toBeNull()

      wrapper.unmount()
    })
  })

  it('commits only after the second valid auto-apply range click in the input wrapper', async () => {
    await runWithDesktopWidth(async () => {
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: [
            new Date('2026-01-12T00:00:00.000Z'),
            new Date('2026-01-19T00:00:00.000Z'),
          ],
          autoApply: true,
          menu: true,
          month: 0,
          year: 2026,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      await wrapper.find('[data-date="2026-01-20"]').trigger('click')
      await wrapper.find('[data-date="2026-01-23"]').trigger('click')
      await wrapper.vm.$nextTick()

      const value = lastEmitted<[Date | null, Date | null]>(
        wrapper,
        'update:modelValue',
      )
      const payload = lastEmitted<AdvancedDateInputCommitPayload<Date>>(
        wrapper,
        'inputCommit',
      )

      expect(toLocalYmd(value?.[0])).toBe('2026-01-20')
      expect(toLocalYmd(value?.[1])).toBe('2026-01-23')
      expect(toLocalYmd(payload?.draft.selection.start)).toBe('2026-01-20')
      expect(toLocalYmd(payload?.draft.selection.end)).toBe('2026-01-23')
      expect(payload?.draft.parseStatus).toBe('complete')
      expect(payload?.draft.isDirty).toBe(false)
      expect(publicHandle(wrapper).isDirty).toBe(false)
      expect(publicHandle(wrapper).draft.isDirty).toBe(false)

      wrapper.unmount()
    })
  })

  it('emits typed partial ranges through text and draft state without committing the model', async () => {
    const wrapper = render(VAdvancedDateInput, {
      props: {
        modelValue: [
          new Date('2026-01-12T00:00:00.000Z'),
          new Date('2026-01-19T00:00:00.000Z'),
        ],
        month: 0,
        year: 2026,
      },
      attachTo: document.body,
    })

    const input = wrapper.find('input')

    await input.setValue('Jan 20, 2026')
    await wrapper.vm.$nextTick()

    const text = lastEmitted<string>(wrapper, 'update:text')
    const draft = lastEmitted<AdvancedDateInputDraft<Date>>(
      wrapper,
      'update:draft',
    )

    expect(text).toBe('Jan 20, 2026')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(draft?.source).toBe('text')
    expect(draft?.parseStatus).toBe('partial')
    expect(toLocalYmd(draft?.selection.start)).toBe('2026-01-20')
    expect(draft?.selection.end).toBeNull()

    wrapper.unmount()
  })

  it('preserves a controlled draft text value on mount instead of replacing it with the committed model', async () => {
    const wrapper = render(VAdvancedDateInput, {
      props: {
        modelValue: [
          new Date('2026-01-12T00:00:00.000Z'),
          new Date('2026-01-19T00:00:00.000Z'),
        ],
        text: 'Jan 20, 2026',
        month: 0,
        year: 2026,
      },
      attachTo: document.body,
    })

    const draft = lastEmitted<AdvancedDateInputDraft<Date>>(
      wrapper,
      'update:draft',
    )

    expect(wrapper.find('input').element.value).toBe('Jan 20, 2026')
    expect(wrapper.emitted('update:text')).toBeUndefined()
    expect(draft?.source).toBe('text')
    expect(draft?.parseStatus).toBe('partial')
    expect(toLocalYmd(draft?.selection.start)).toBe('2026-01-20')
    expect(draft?.selection.end).toBeNull()

    wrapper.unmount()
  })

  it('syncs an initial controlled draft text value into the picker selection on mount', async () => {
    await runWithDesktopWidth(async () => {
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: [
            new Date('2026-01-12T00:00:00.000Z'),
            new Date('2026-01-19T00:00:00.000Z'),
          ],
          text: 'Jan 20, 2026',
          menu: true,
          month: 0,
          year: 2026,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      expect(wrapper.find('[data-date="2026-01-20"]').classes()).toContain(
        'v-advanced-date-picker__day--selected',
      )
      expect(wrapper.find('[data-date="2026-01-12"]').classes()).not.toContain(
        'v-advanced-date-picker__day--selected',
      )

      wrapper.unmount()
    })
  })

  it('keeps controlled v-model:text in sync with picker-authored drafts', async () => {
    await runWithDesktopWidth(async () => {
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: [
            new Date('2026-01-12T00:00:00.000Z'),
            new Date('2026-01-19T00:00:00.000Z'),
          ],
          text: 'Jan 12, 2026 – Jan 19, 2026',
          menu: true,
          month: 0,
          year: 2026,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      await wrapper.find('[data-date="2026-01-20"]').trigger('click')
      await wrapper.vm.$nextTick()

      const partialText = lastEmitted<string>(wrapper, 'update:text')

      expect(partialText).toBe('Jan 20, 2026')

      await wrapper.setProps({ text: partialText })
      await wrapper.vm.$nextTick()

      expect(wrapper.find('input').element.value).toBe('Jan 20, 2026')
      expect(publicHandle(wrapper).draft.source).toBe('picker')
      expect(publicHandle(wrapper).draft.parseStatus).toBe('partial')
      expect(toLocalYmd(publicHandle(wrapper).draft.selection.start)).toBe(
        '2026-01-20',
      )

      await wrapper.find('[data-date="2026-01-23"]').trigger('click')
      await wrapper.vm.$nextTick()

      const committedText = lastEmitted<string>(wrapper, 'update:text')
      const committedValue = lastEmitted<[Date | null, Date | null]>(
        wrapper,
        'update:modelValue',
      )

      expect(committedText).toBe('Jan 20, 2026 – Jan 23, 2026')
      expect(toLocalYmd(committedValue?.[0])).toBe('2026-01-20')
      expect(toLocalYmd(committedValue?.[1])).toBe('2026-01-23')

      wrapper.unmount()
    })
  })

  it('treats committed controlled text as a mirror when modelValue changes', async () => {
    await runWithDesktopWidth(async () => {
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: [
            new Date('2026-01-12T00:00:00.000Z'),
            new Date('2026-01-19T00:00:00.000Z'),
          ],
          text: 'Jan 12, 2026 – Jan 19, 2026',
          menu: true,
          month: 0,
          year: 2026,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      await wrapper.setProps({
        modelValue: [
          new Date('2026-01-25T00:00:00.000Z'),
          new Date('2026-01-29T00:00:00.000Z'),
        ],
      })
      await wrapper.vm.$nextTick()
      await flushPromises()

      const text = lastEmitted<string>(wrapper, 'update:text')

      expect(text).toBe('Jan 25, 2026 – Jan 29, 2026')
      expect(wrapper.find('input').element.value).toBe(
        'Jan 25, 2026 – Jan 29, 2026',
      )
      expect(publicHandle(wrapper).draft.source).toBe('picker')
      expect(publicHandle(wrapper).isDirty).toBe(false)
      expect(wrapper.find('[data-date="2026-01-25"]').classes()).toContain(
        'v-advanced-date-picker__day--selected',
      )
      expect(wrapper.find('[data-date="2026-01-12"]').classes()).not.toContain(
        'v-advanced-date-picker__day--selected',
      )

      wrapper.unmount()
    })
  })

  it('keeps an explicitly supplied controlled draft text authoritative across modelValue updates', async () => {
    await runWithDesktopWidth(async () => {
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: [
            new Date('2026-01-12T00:00:00.000Z'),
            new Date('2026-01-19T00:00:00.000Z'),
          ],
          text: 'Jan 12, 2026 – Jan 19, 2026',
          menu: true,
          month: 0,
          year: 2026,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      const updateTextCount = wrapper.emitted('update:text')?.length ?? 0

      await wrapper.setProps({
        modelValue: [
          new Date('2026-01-25T00:00:00.000Z'),
          new Date('2026-01-29T00:00:00.000Z'),
        ],
        text: 'Jan 20, 2026',
      })
      await wrapper.vm.$nextTick()
      await flushPromises()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('input').element.value).toBe('Jan 20, 2026')
      expect(wrapper.emitted('update:text')?.length ?? 0).toBe(updateTextCount)
      expect(publicHandle(wrapper).draft.source).toBe('text')
      expect(publicHandle(wrapper).draft.parseStatus).toBe('partial')
      expect(toLocalYmd(publicHandle(wrapper).draft.selection.start)).toBe(
        '2026-01-20',
      )
      expect(publicHandle(wrapper).draft.selection.end).toBeNull()
      expect(wrapper.find('[data-date="2026-01-20"]').classes()).toContain(
        'v-advanced-date-picker__day--selected',
      )
      expect(wrapper.find('[data-date="2026-01-25"]').classes()).not.toContain(
        'v-advanced-date-picker__day--selected',
      )

      wrapper.unmount()
    })
  })

  it('keeps a controlled draft text authoritative when modelValue changes without a new text prop', async () => {
    await runWithDesktopWidth(async () => {
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: [
            new Date('2026-01-12T00:00:00.000Z'),
            new Date('2026-01-19T00:00:00.000Z'),
          ],
          text: 'Jan 20, 2026',
          menu: true,
          month: 0,
          year: 2026,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      const updateTextCount = wrapper.emitted('update:text')?.length ?? 0

      await wrapper.setProps({
        modelValue: [
          new Date('2026-01-25T00:00:00.000Z'),
          new Date('2026-01-29T00:00:00.000Z'),
        ],
      })
      await wrapper.vm.$nextTick()
      await flushPromises()

      expect(wrapper.find('input').element.value).toBe('Jan 20, 2026')
      expect(wrapper.emitted('update:text')?.length ?? 0).toBe(updateTextCount)
      expect(publicHandle(wrapper).draft.source).toBe('text')
      expect(publicHandle(wrapper).draft.parseStatus).toBe('partial')
      expect(toLocalYmd(publicHandle(wrapper).draft.selection.start)).toBe(
        '2026-01-20',
      )
      expect(publicHandle(wrapper).draft.selection.end).toBeNull()
      expect(wrapper.find('[data-date="2026-01-20"]').classes()).toContain(
        'v-advanced-date-picker__day--selected',
      )
      expect(wrapper.find('[data-date="2026-01-25"]').classes()).not.toContain(
        'v-advanced-date-picker__day--selected',
      )

      wrapper.unmount()
    })
  })

  it('keeps a controlled draft text authoritative when range changes without a new text prop', async () => {
    await runWithDesktopWidth(async () => {
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: new Date('2026-01-12T00:00:00.000Z'),
          text: 'Jan 20, 2026',
          range: false,
          menu: true,
          month: 0,
          year: 2026,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      const updateTextCount = wrapper.emitted('update:text')?.length ?? 0

      await wrapper.setProps({
        range: true,
        modelValue: [
          new Date('2026-01-25T00:00:00.000Z'),
          new Date('2026-01-29T00:00:00.000Z'),
        ],
      })
      await wrapper.vm.$nextTick()
      await flushPromises()

      expect(wrapper.find('input').element.value).toBe('Jan 20, 2026')
      expect(wrapper.emitted('update:text')?.length ?? 0).toBe(updateTextCount)
      expect(publicHandle(wrapper).draft.source).toBe('text')
      expect(publicHandle(wrapper).draft.parseStatus).toBe('partial')
      expect(toLocalYmd(publicHandle(wrapper).draft.selection.start)).toBe(
        '2026-01-20',
      )
      expect(publicHandle(wrapper).draft.selection.end).toBeNull()
      expect(wrapper.find('[data-date="2026-01-20"]').classes()).toContain(
        'v-advanced-date-picker__day--selected',
      )
      expect(wrapper.find('[data-date="2026-01-25"]').classes()).not.toContain(
        'v-advanced-date-picker__day--selected',
      )

      wrapper.unmount()
    })
  })

  it('re-syncs controlled text drafts into the picker when parser context changes', async () => {
    await runWithDesktopWidth(async () => {
      const initialParseInput = (value: string) => {
        return value === 'special' ? new Date('2026-01-20T00:00:00.000Z') : null
      }
      const updatedParseInput = (value: string) => {
        return value === 'special' ? new Date('2026-01-25T00:00:00.000Z') : null
      }
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: new Date('2026-01-12T00:00:00.000Z'),
          text: 'special',
          parseInput: initialParseInput,
          allowedStartDates: allowOnly('2026-01-20'),
          menu: true,
          range: false,
          month: 0,
          year: 2026,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      expect(wrapper.find('[data-date="2026-01-20"]').classes()).toContain(
        'v-advanced-date-picker__day--selected',
      )
      expect(wrapper.find('[data-date="2026-01-12"]').classes()).not.toContain(
        'v-advanced-date-picker__day--selected',
      )

      await wrapper.setProps({
        parseInput: updatedParseInput,
        allowedStartDates: allowOnly('2026-01-25'),
      })
      await wrapper.vm.$nextTick()
      await flushPromises()

      const draft = lastEmitted<AdvancedDateInputDraft<Date>>(
        wrapper,
        'update:draft',
      )

      expect(wrapper.find('input').element.value).toBe('special')
      expect(toLocalYmd(draft?.selection.start)).toBe('2026-01-25')
      expect(draft?.availabilityStatus).toBe('available')
      expect(wrapper.find('[data-date="2026-01-25"]').classes()).toContain(
        'v-advanced-date-picker__day--selected',
      )
      expect(wrapper.find('[data-date="2026-01-20"]').classes()).not.toContain(
        'v-advanced-date-picker__day--selected',
      )

      wrapper.unmount()
    })
  })

  it('preserves an uncontrolled typed draft when modelValue changes mid-edit', async () => {
    await runWithDesktopWidth(async () => {
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: [
            new Date('2026-01-12T00:00:00.000Z'),
            new Date('2026-01-19T00:00:00.000Z'),
          ],
          menu: true,
          month: 0,
          year: 2026,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      const input = wrapper.find('input')

      await input.setValue('Jan 20, 2026')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('input').element.value).toBe('Jan 20, 2026')
      expect(publicHandle(wrapper).draft.source).toBe('text')
      expect(publicHandle(wrapper).draft.parseStatus).toBe('partial')

      const updateTextCount = wrapper.emitted('update:text')?.length ?? 0

      await wrapper.setProps({
        modelValue: [
          new Date('2026-01-25T00:00:00.000Z'),
          new Date('2026-01-29T00:00:00.000Z'),
        ],
      })
      await wrapper.vm.$nextTick()

      expect(wrapper.find('input').element.value).toBe('Jan 20, 2026')
      expect(wrapper.emitted('update:text')?.length ?? 0).toBe(updateTextCount)
      expect(wrapper.find('[data-date="2026-01-20"]').classes()).toContain(
        'v-advanced-date-picker__day--selected',
      )
      expect(wrapper.find('[data-date="2026-01-25"]').classes()).not.toContain(
        'v-advanced-date-picker__day--selected',
      )
      expect(toLocalYmd(publicHandle(wrapper).draft.selection.start)).toBe(
        '2026-01-20',
      )
      expect(publicHandle(wrapper).draft.selection.end).toBeNull()

      wrapper.unmount()
    })
  })

  it('emits invalid typed text through text and draft state without committing the model', async () => {
    const wrapper = render(VAdvancedDateInput, {
      props: {
        modelValue: [
          new Date('2026-01-12T00:00:00.000Z'),
          new Date('2026-01-19T00:00:00.000Z'),
        ],
        month: 0,
        year: 2026,
      },
      attachTo: document.body,
    })

    const input = wrapper.find('input')

    await input.setValue('not a range')
    await wrapper.vm.$nextTick()

    const text = lastEmitted<string>(wrapper, 'update:text')
    const draft = lastEmitted<AdvancedDateInputDraft<Date>>(
      wrapper,
      'update:draft',
    )

    expect(text).toBe('not a range')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(draft?.source).toBe('text')
    expect(draft?.parseStatus).toBe('invalid')
    expect(draft?.selection.start).toBeNull()
    expect(draft?.selection.end).toBeNull()

    wrapper.unmount()
  })

  it('preserves the parsed start date for invalid range text with an invalid end', async () => {
    await runWithDesktopWidth(async () => {
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: [
            new Date('2026-01-12T00:00:00.000Z'),
            new Date('2026-01-19T00:00:00.000Z'),
          ],
          menu: true,
          month: 0,
          year: 2026,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      await wrapper.find('input').setValue('Jan 20, 2026 - foo')
      await wrapper.vm.$nextTick()

      const draft = lastEmitted<AdvancedDateInputDraft<Date>>(
        wrapper,
        'update:draft',
      )

      expect(draft?.parseStatus).toBe('invalid')
      expect(toLocalYmd(draft?.selection.start)).toBe('2026-01-20')
      expect(draft?.selection.end).toBeNull()
      expect(wrapper.find('[data-date="2026-01-20"]').classes()).toContain(
        'v-advanced-date-picker__day--selected',
      )
      expect(wrapper.find('[data-date="2026-01-12"]').classes()).not.toContain(
        'v-advanced-date-picker__day--selected',
      )

      wrapper.unmount()
    })
  })

  it('syncs valid typed drafts into the picker selection before submit or blur', async () => {
    await runWithDesktopWidth(async () => {
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: [
            new Date('2026-01-12T00:00:00.000Z'),
            new Date('2026-01-19T00:00:00.000Z'),
          ],
          menu: true,
          month: 0,
          year: 2026,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      await wrapper.find('input').setValue('Jan 20, 2026')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-date="2026-01-20"]').classes()).toContain(
        'v-advanced-date-picker__day--selected',
      )
      expect(wrapper.find('[data-date="2026-01-12"]').classes()).not.toContain(
        'v-advanced-date-picker__day--selected',
      )

      wrapper.unmount()
    })
  })

  it('keeps complete typed drafts pending after blur until commitInput runs', async () => {
    const wrapper = render(VAdvancedDateInput, {
      props: {
        modelValue: null,
        range: false,
        month: 0,
        year: 2026,
      },
      attachTo: document.body,
    })

    const input = wrapper.find('input')

    await input.setValue('Jan 12, 2026')
    await input.trigger('blur')
    await flushPromises()

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()

    const success = await publicHandle(wrapper).commitInput()
    const value = lastEmitted<Date | null>(wrapper, 'update:modelValue')

    expect(success).toBe(true)
    expect(value).toBeInstanceOf(Date)
    expect(toLocalYmd(value)).toBe('2026-01-12')

    wrapper.unmount()
  })

  it('treats a clean commitInput call as a no-op success', async () => {
    const wrapper = render(VAdvancedDateInput, {
      props: {
        modelValue: new Date('2026-01-12T00:00:00.000Z'),
        range: false,
        month: 0,
        year: 2026,
      },
      attachTo: document.body,
    })

    const success = await publicHandle(wrapper).commitInput()

    expect(success).toBe(true)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('inputCommit')).toBeUndefined()
    expect(wrapper.find('input').element.value).toBe('Jan 12, 2026')
    expect(publicHandle(wrapper).isDirty).toBe(false)

    wrapper.unmount()
  })

  it('normalizes equivalent typed ranges without emitting a redundant commit', async () => {
    const wrapper = render(VAdvancedDateInput, {
      props: {
        modelValue: [
          new Date('2026-01-20T00:00:00.000Z'),
          new Date('2026-01-23T00:00:00.000Z'),
        ],
        month: 0,
        year: 2026,
      },
      attachTo: document.body,
    })

    await wrapper.find('input').setValue('Jan 23, 2026 - Jan 20, 2026')
    await wrapper.vm.$nextTick()

    const success = await publicHandle(wrapper).commitInput()

    expect(success).toBe(true)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('inputCommit')).toBeUndefined()
    expect(wrapper.find('input').element.value).toBe(
      'Jan 20, 2026 – Jan 23, 2026',
    )
    expect(publicHandle(wrapper).isDirty).toBe(false)

    wrapper.unmount()
  })

  it('blocks commitInput for incomplete drafts instead of reusing the committed model', async () => {
    const wrapper = render(VAdvancedDateInput, {
      props: {
        modelValue: [
          new Date('2026-01-12T00:00:00.000Z'),
          new Date('2026-01-19T00:00:00.000Z'),
        ],
        month: 0,
        year: 2026,
      },
      attachTo: document.body,
    })

    await wrapper.find('input').setValue('Jan 20, 2026')
    await wrapper.vm.$nextTick()

    const success = await publicHandle(wrapper).commitInput()
    const payload = lastEmitted<AdvancedDateInputInvalidPayload<Date>>(
      wrapper,
      'inputInvalid',
    )

    expect(success).toBe(false)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(payload?.reason).toBe('incomplete')
    expect(toLocalYmd(payload?.draft.selection.start)).toBe('2026-01-20')
    expect(payload?.draft.selection.end).toBeNull()
    expect(wrapper.find('input').element.value).toBe('Jan 20, 2026')

    wrapper.unmount()
  })

  it('blocks commitInput for invalid drafts', async () => {
    const wrapper = render(VAdvancedDateInput, {
      props: {
        modelValue: [
          new Date('2026-01-12T00:00:00.000Z'),
          new Date('2026-01-19T00:00:00.000Z'),
        ],
        month: 0,
        year: 2026,
      },
      attachTo: document.body,
    })

    await wrapper.find('input').setValue('not a range')
    await wrapper.vm.$nextTick()

    const success = await publicHandle(wrapper).commitInput()
    const payload = lastEmitted<AdvancedDateInputInvalidPayload<Date>>(
      wrapper,
      'inputInvalid',
    )

    expect(success).toBe(false)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(payload?.reason).toBe('invalid')
    expect(payload?.draft.parseStatus).toBe('invalid')

    wrapper.unmount()
  })

  it('blocks commitInput for unavailable drafts', async () => {
    const wrapper = render(VAdvancedDateInput, {
      props: {
        modelValue: new Date('2026-01-12T00:00:00.000Z'),
        range: false,
        allowedStartDates: allowOnly('2026-01-12'),
        month: 0,
        year: 2026,
      },
      attachTo: document.body,
    })

    await wrapper.find('input').setValue('Jan 13, 2026')
    await wrapper.vm.$nextTick()

    const success = await publicHandle(wrapper).commitInput()
    const payload = lastEmitted<AdvancedDateInputInvalidPayload<Date>>(
      wrapper,
      'inputInvalid',
    )

    expect(success).toBe(false)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(payload?.reason).toBe('unavailable')
    expect(payload?.draft.availabilityStatus).toBe('unavailable')
    expect(toLocalYmd(payload?.draft.selection.start)).toBe('2026-01-13')

    wrapper.unmount()
  })

  it('surfaces picker-originated incomplete drafts on commitInput', async () => {
    await runWithDesktopWidth(async () => {
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: [
            new Date('2026-01-12T00:00:00.000Z'),
            new Date('2026-01-19T00:00:00.000Z'),
          ],
          autoApply: false,
          menu: true,
          month: 0,
          year: 2026,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      await wrapper.find('[data-date="2026-01-20"]').trigger('click')
      await wrapper.vm.$nextTick()

      const success = await publicHandle(wrapper).commitInput()
      const payload = lastEmitted<AdvancedDateInputInvalidPayload<Date>>(
        wrapper,
        'inputInvalid',
      )

      expect(success).toBe(false)
      expect(payload?.reason).toBe('incomplete')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(publicHandle(wrapper).errorMessages).toContain(
        'Enter a valid date range',
      )
      expect(publicHandle(wrapper).isValid).toBe(false)
      expect(wrapper.text()).toContain('Enter a valid date range')

      wrapper.unmount()
    })
  })

  it('returns picker-originated incomplete draft errors from the exposed validate API', async () => {
    await runWithDesktopWidth(async () => {
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: [
            new Date('2026-01-12T00:00:00.000Z'),
            new Date('2026-01-19T00:00:00.000Z'),
          ],
          autoApply: false,
          menu: true,
          month: 0,
          year: 2026,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      await wrapper.find('[data-date="2026-01-20"]').trigger('click')
      await wrapper.vm.$nextTick()

      const messages = await publicHandle(wrapper).validate()
      await flushPromises()

      expect(messages).toEqual(['Enter a valid date range'])
      expect(wrapper.emitted('inputInvalid')).toBeUndefined()
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(publicHandle(wrapper).errorMessages).toContain(
        'Enter a valid date range',
      )
      expect(publicHandle(wrapper).isValid).toBe(false)
      expect(wrapper.text()).toContain('Enter a valid date range')

      wrapper.unmount()
    })
  })

  it('revalidates picker drafts when availability constraints change before commitInput', async () => {
    await runWithDesktopWidth(async () => {
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: null,
          autoApply: false,
          menu: true,
          range: false,
          month: 0,
          year: 2026,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      await wrapper.find('[data-date="2026-01-12"]').trigger('click')
      await wrapper.vm.$nextTick()

      await wrapper.setProps({
        allowedStartDates: allowOnly('2026-01-13'),
      })
      await wrapper.vm.$nextTick()

      const draft = lastEmitted<AdvancedDateInputDraft<Date>>(
        wrapper,
        'update:draft',
      )
      const validationMessages = await publicHandle(wrapper).validate()
      const success = await publicHandle(wrapper).commitInput()
      const payload = lastEmitted<AdvancedDateInputInvalidPayload<Date>>(
        wrapper,
        'inputInvalid',
      )

      expect(draft?.availabilityStatus).toBe('unavailable')
      expect(publicHandle(wrapper).draft.availabilityStatus).toBe('unavailable')
      expect(validationMessages).toEqual(['Date is unavailable'])
      expect(success).toBe(false)
      expect(payload?.reason).toBe('unavailable')
      expect(toLocalYmd(payload?.draft.selection.start)).toBe('2026-01-12')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(publicHandle(wrapper).errorMessages).toContain(
        'Date is unavailable',
      )
      expect(publicHandle(wrapper).isValid).toBe(false)
      expect(wrapper.text()).toContain('Date is unavailable')

      wrapper.unmount()
    })
  })

  it('runs field rules through the exposed validate and commit API', async () => {
    const requiredRule = vi.fn((value: string) => !!value || 'Required')
    const wrapper = render(VAdvancedDateInput, {
      props: {
        modelValue: null,
        range: false,
        rules: [requiredRule],
      },
      attachTo: document.body,
    })

    const messages = await publicHandle(wrapper).validate()
    await flushPromises()

    expect(messages).toEqual(['Required'])
    expect(publicHandle(wrapper).errorMessages).toContain('Required')

    const success = await publicHandle(wrapper).commitInput()
    const payload = lastEmitted<AdvancedDateInputInvalidPayload<Date>>(
      wrapper,
      'inputInvalid',
    )

    expect(success).toBe(false)
    expect(payload?.reason).toBe('rule')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()

    wrapper.unmount()
  })

  it('keeps the public validity API nullable while pristine and after resetValidation', async () => {
    const wrapper = render(VAdvancedDateInput, {
      props: {
        modelValue: null,
        range: false,
      },
      attachTo: document.body,
    })

    expect(publicHandle(wrapper).isPristine).toBe(true)
    expect(publicHandle(wrapper).isValid).toBeNull()

    const input = wrapper.find('input')

    await input.setValue('not a date')
    await input.trigger('blur')
    await flushPromises()

    expect(publicHandle(wrapper).isPristine).toBe(false)
    expect(publicHandle(wrapper).isValid).toBe(false)

    await publicHandle(wrapper).resetValidation()
    await flushPromises()

    expect(publicHandle(wrapper).errorMessages).toEqual([])
    expect(publicHandle(wrapper).isPristine).toBe(true)
    expect(publicHandle(wrapper).isValid).toBeNull()

    wrapper.unmount()
  })

  it('clears dirty state immediately after a successful commitInput before props round-trip', async () => {
    const wrapper = render(VAdvancedDateInput, {
      props: {
        modelValue: [
          new Date('2026-01-12T00:00:00.000Z'),
          new Date('2026-01-19T00:00:00.000Z'),
        ],
        month: 0,
        year: 2026,
      },
      attachTo: document.body,
    })

    await wrapper.find('input').setValue('Jan 20, 2026 - Jan 23, 2026')
    await wrapper.vm.$nextTick()

    const success = await publicHandle(wrapper).commitInput()
    const payload = lastEmitted<AdvancedDateInputCommitPayload<Date>>(
      wrapper,
      'inputCommit',
    )

    expect(success).toBe(true)
    expect(payload?.draft.isDirty).toBe(false)
    expect(publicHandle(wrapper).isDirty).toBe(false)
    expect(publicHandle(wrapper).draft.isDirty).toBe(false)

    wrapper.unmount()
  })

  it('awaits async field rules in the exposed validate API', async () => {
    const asyncRule = vi.fn(async (value: string) => {
      return value ? true : 'Async required'
    })
    const wrapper = render(VAdvancedDateInput, {
      props: {
        modelValue: null,
        range: false,
        rules: [asyncRule],
      },
      attachTo: document.body,
    })

    const messages = await publicHandle(wrapper).validate()
    await flushPromises()

    expect(messages).toEqual(['Async required'])
    expect(publicHandle(wrapper).errorMessages).toContain('Async required')

    wrapper.unmount()
  })

  it("restores the last committed value when closeDraftStrategy is 'revert'", async () => {
    await runWithDesktopWidth(async () => {
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: [
            new Date('2026-01-12T00:00:00.000Z'),
            new Date('2026-01-19T00:00:00.000Z'),
          ],
          closeDraftStrategy: 'revert',
          menu: true,
          month: 0,
          year: 2026,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      await wrapper.find('[data-date="2026-01-20"]').trigger('click')
      wrapper
        .findComponent({ name: 'VMenu' })
        .vm.$emit('update:modelValue', false)
      await wrapper.vm.$nextTick()

      const payload = lastEmitted<AdvancedDateInputClosePayload<Date>>(
        wrapper,
        'draftClose',
      )

      expect(wrapper.find('input').element.value).toBe(
        'Jan 12, 2026 – Jan 19, 2026',
      )
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(payload?.reason).toBe('dismiss')
      expect(payload?.strategy).toBe('revert')
      expect(payload?.outcome).toBe('closed')
      expect(toLocalYmd(payload?.draft.selection.start)).toBe('2026-01-20')
      expect(payload?.draft.selection.end).toBeNull()
      expect(toLocalYmd(publicHandle(wrapper).draft.selection.start)).toBe(
        '2026-01-12',
      )
      expect(toLocalYmd(publicHandle(wrapper).draft.selection.end)).toBe(
        '2026-01-19',
      )

      wrapper.unmount()
    })
  })

  it("lets closeDraftStrategy 'revert' discard a complete typed draft after blur", async () => {
    await runWithDesktopWidth(async () => {
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: new Date('2026-01-12T00:00:00.000Z'),
          closeDraftStrategy: 'revert',
          menu: true,
          range: false,
          month: 0,
          year: 2026,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      const input = wrapper.find('input')

      await input.setValue('Jan 20, 2026')
      await input.trigger('blur')
      await flushPromises()

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()

      wrapper
        .findComponent({ name: 'VMenu' })
        .vm.$emit('update:modelValue', false)
      await wrapper.vm.$nextTick()
      await flushPromises()

      const payload = lastEmitted<AdvancedDateInputClosePayload<Date>>(
        wrapper,
        'draftClose',
      )

      expect(wrapper.find('input').element.value).toBe('Jan 12, 2026')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(payload?.reason).toBe('dismiss')
      expect(payload?.strategy).toBe('revert')
      expect(payload?.outcome).toBe('closed')
      expect(payload?.draft.source).toBe('text')
      expect(payload?.draft.parseStatus).toBe('complete')
      expect(toLocalYmd(payload?.draft.selection.start)).toBe('2026-01-20')

      wrapper.unmount()
    })
  })

  it("keeps partial draft state across close and reopen when closeDraftStrategy is 'preserve'", async () => {
    await runWithDesktopWidth(async () => {
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: [
            new Date('2026-01-12T00:00:00.000Z'),
            new Date('2026-01-19T00:00:00.000Z'),
          ],
          closeDraftStrategy: 'preserve',
          menu: true,
          month: 0,
          year: 2026,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      await wrapper.find('[data-date="2026-01-20"]').trigger('click')
      wrapper
        .findComponent({ name: 'VMenu' })
        .vm.$emit('update:modelValue', false)
      await wrapper.vm.$nextTick()
      await flushPromises()

      wrapper
        .findComponent({ name: 'VTextField' })
        .vm.$emit('click:control', new MouseEvent('click'))
      await wrapper.vm.$nextTick()

      const payload = lastEmitted<AdvancedDateInputClosePayload<Date>>(
        wrapper,
        'draftClose',
      )

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(wrapper.find('input').element.value).toBe('Jan 20, 2026')
      expect(payload?.strategy).toBe('preserve')
      expect(payload?.outcome).toBe('closed')
      expect(toLocalYmd(publicHandle(wrapper).draft.selection.start)).toBe(
        '2026-01-20',
      )
      expect(publicHandle(wrapper).draft.selection.end).toBeNull()
      expect(wrapper.emitted('update:menu')).toEqual([[false], [true]])

      wrapper.unmount()
    })
  })

  it("lets closeDraftStrategy 'preserve' keep a complete typed draft after blur", async () => {
    await runWithDesktopWidth(async () => {
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: new Date('2026-01-12T00:00:00.000Z'),
          closeDraftStrategy: 'preserve',
          menu: true,
          range: false,
          month: 0,
          year: 2026,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      const input = wrapper.find('input')

      await input.setValue('Jan 20, 2026')
      await input.trigger('blur')
      await flushPromises()

      wrapper
        .findComponent({ name: 'VMenu' })
        .vm.$emit('update:modelValue', false)
      await wrapper.vm.$nextTick()
      await flushPromises()

      wrapper
        .findComponent({ name: 'VTextField' })
        .vm.$emit('click:control', new MouseEvent('click'))
      await wrapper.vm.$nextTick()

      const payload = lastEmitted<AdvancedDateInputClosePayload<Date>>(
        wrapper,
        'draftClose',
      )

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(wrapper.find('input').element.value).toBe('Jan 20, 2026')
      expect(payload?.strategy).toBe('preserve')
      expect(payload?.outcome).toBe('closed')
      expect(payload?.draft.source).toBe('text')
      expect(payload?.draft.parseStatus).toBe('complete')
      expect(toLocalYmd(publicHandle(wrapper).draft.selection.start)).toBe(
        '2026-01-20',
      )
      expect(wrapper.emitted('update:menu')).toEqual([[false], [true]])

      wrapper.unmount()
    })
  })

  it("blocks overlay close for incomplete drafts when closeDraftStrategy is 'commit'", async () => {
    await runWithDesktopWidth(async () => {
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: [
            new Date('2026-01-12T00:00:00.000Z'),
            new Date('2026-01-19T00:00:00.000Z'),
          ],
          autoApply: false,
          closeDraftStrategy: 'commit',
          menu: true,
          month: 0,
          year: 2026,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      await wrapper.find('[data-date="2026-01-20"]').trigger('click')
      wrapper
        .findComponent({ name: 'VMenu' })
        .vm.$emit('update:modelValue', false)
      await wrapper.vm.$nextTick()
      await flushPromises()

      const invalidPayload = lastEmitted<AdvancedDateInputInvalidPayload<Date>>(
        wrapper,
        'inputInvalid',
      )
      const closePayload = lastEmitted<AdvancedDateInputClosePayload<Date>>(
        wrapper,
        'draftClose',
      )

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(wrapper.emitted('update:menu')).toBeUndefined()
      expect(invalidPayload?.reason).toBe('incomplete')
      expect(closePayload?.strategy).toBe('commit')
      expect(closePayload?.outcome).toBe('blocked')
      expect(wrapper.find('input').element.value).toBe('Jan 20, 2026')
      expect(publicHandle(wrapper).errorMessages).toContain(
        'Enter a valid date range',
      )
      expect(publicHandle(wrapper).isValid).toBe(false)
      expect(wrapper.text()).toContain('Enter a valid date range')

      wrapper.unmount()
    })
  })

  it("blocks closeDraftStrategy 'commit' when a picker draft becomes unavailable before dismiss", async () => {
    await runWithDesktopWidth(async () => {
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: null,
          autoApply: false,
          closeDraftStrategy: 'commit',
          menu: true,
          range: false,
          month: 0,
          year: 2026,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      await wrapper.find('[data-date="2026-01-12"]').trigger('click')
      await wrapper.vm.$nextTick()

      await wrapper.setProps({
        allowedStartDates: allowOnly('2026-01-13'),
      })
      await wrapper.vm.$nextTick()

      wrapper
        .findComponent({ name: 'VMenu' })
        .vm.$emit('update:modelValue', false)
      await wrapper.vm.$nextTick()
      await flushPromises()

      const invalidPayload = lastEmitted<AdvancedDateInputInvalidPayload<Date>>(
        wrapper,
        'inputInvalid',
      )
      const closePayload = lastEmitted<AdvancedDateInputClosePayload<Date>>(
        wrapper,
        'draftClose',
      )

      expect(publicHandle(wrapper).draft.availabilityStatus).toBe('unavailable')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(wrapper.emitted('update:menu')).toBeUndefined()
      expect(invalidPayload?.reason).toBe('unavailable')
      expect(closePayload?.strategy).toBe('commit')
      expect(closePayload?.outcome).toBe('blocked')
      expect(wrapper.find('input').element.value).toBe('Jan 12, 2026')

      wrapper.unmount()
    })
  })

  it("lets the picker Cancel action discard the draft even when closeDraftStrategy is 'commit'", async () => {
    await runWithDesktopWidth(async () => {
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: [
            new Date('2026-01-12T00:00:00.000Z'),
            new Date('2026-01-19T00:00:00.000Z'),
          ],
          autoApply: false,
          closeDraftStrategy: 'commit',
          menu: true,
          month: 0,
          year: 2026,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      await wrapper.find('[data-date="2026-01-20"]').trigger('click')
      await wrapper.vm.$nextTick()

      const cancelButton = wrapper
        .findAll('button')
        .find((button) => button.text() === 'Cancel')

      expect(cancelButton).toBeDefined()

      await cancelButton!.trigger('click')
      await wrapper.vm.$nextTick()
      await flushPromises()

      const closePayload = lastEmitted<AdvancedDateInputClosePayload<Date>>(
        wrapper,
        'draftClose',
      )

      expect(wrapper.find('input').element.value).toBe(
        'Jan 12, 2026 – Jan 19, 2026',
      )
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(wrapper.emitted('inputCommit')).toBeUndefined()
      expect(wrapper.emitted('inputInvalid')).toBeUndefined()
      expect(wrapper.emitted('cancel')?.length).toBe(1)
      expect(wrapper.emitted('update:menu')?.at(-1)).toEqual([false])
      expect(closePayload?.reason).toBe('cancel')
      expect(closePayload?.strategy).toBe('revert')
      expect(closePayload?.outcome).toBe('closed')
      expect(toLocalYmd(closePayload?.draft.selection.start)).toBe('2026-01-20')
      expect(closePayload?.draft.selection.end).toBeNull()

      wrapper.unmount()
    })
  })

  it('re-emits cancel when Escape closes the picker', async () => {
    await runWithDesktopWidth(async () => {
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: [
            new Date('2026-01-12T00:00:00.000Z'),
            new Date('2026-01-19T00:00:00.000Z'),
          ],
          menu: true,
          month: 0,
          year: 2026,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      await wrapper.find('[data-date="2026-01-20"]').trigger('click')
      await wrapper.vm.$nextTick()

      const picker = wrapper.findComponent({ name: 'VAdvancedDatePicker' })
      const onEscapeKey = picker.props('onEscapeKey') as
        | (() => void)
        | undefined

      onEscapeKey?.()
      picker.vm.$emit('cancel')
      await wrapper.vm.$nextTick()
      await flushPromises()

      const closePayload = lastEmitted<AdvancedDateInputClosePayload<Date>>(
        wrapper,
        'draftClose',
      )

      expect(wrapper.emitted('cancel')?.length).toBe(1)
      expect(wrapper.emitted('update:menu')?.at(-1)).toEqual([false])
      expect(closePayload?.reason).toBe('escape')
      expect(closePayload?.strategy).toBe('revert')
      expect(closePayload?.outcome).toBe('closed')
      expect(wrapper.find('input').element.value).toBe(
        'Jan 12, 2026 – Jan 19, 2026',
      )

      wrapper.unmount()
    })
  })

  it("does not emit cancel when Escape is blocked by closeDraftStrategy='commit'", async () => {
    await runWithDesktopWidth(async () => {
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: [
            new Date('2026-01-12T00:00:00.000Z'),
            new Date('2026-01-19T00:00:00.000Z'),
          ],
          autoApply: false,
          closeDraftStrategy: 'commit',
          menu: true,
          month: 0,
          year: 2026,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      await wrapper.find('[data-date="2026-01-20"]').trigger('click')
      await wrapper.vm.$nextTick()

      const picker = wrapper.findComponent({ name: 'VAdvancedDatePicker' })
      const onEscapeKey = picker.props('onEscapeKey') as
        | (() => void)
        | undefined

      onEscapeKey?.()
      picker.vm.$emit('cancel')
      await wrapper.vm.$nextTick()
      await flushPromises()

      const invalidPayload = lastEmitted<AdvancedDateInputInvalidPayload<Date>>(
        wrapper,
        'inputInvalid',
      )
      const closePayload = lastEmitted<AdvancedDateInputClosePayload<Date>>(
        wrapper,
        'draftClose',
      )

      expect(wrapper.emitted('cancel')).toBeUndefined()
      expect(wrapper.emitted('update:menu')).toBeUndefined()
      expect(invalidPayload?.reason).toBe('incomplete')
      expect(closePayload?.reason).toBe('escape')
      expect(closePayload?.strategy).toBe('commit')
      expect(closePayload?.outcome).toBe('blocked')

      wrapper.unmount()
    })
  })

  it("does not emit cancel when Escape successfully commits with closeDraftStrategy='commit'", async () => {
    await runWithDesktopWidth(async () => {
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: [
            new Date('2026-01-12T00:00:00.000Z'),
            new Date('2026-01-19T00:00:00.000Z'),
          ],
          closeDraftStrategy: 'commit',
          menu: true,
          month: 0,
          year: 2026,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      await wrapper.find('[data-date="2026-01-20"]').trigger('click')
      await wrapper.find('[data-date="2026-01-23"]').trigger('click')
      await wrapper.vm.$nextTick()

      const picker = wrapper.findComponent({ name: 'VAdvancedDatePicker' })
      const onEscapeKey = picker.props('onEscapeKey') as
        | (() => void)
        | undefined

      onEscapeKey?.()
      picker.vm.$emit('cancel')
      await wrapper.vm.$nextTick()
      await flushPromises()

      const value = lastEmitted<[Date | null, Date | null]>(
        wrapper,
        'update:modelValue',
      )
      const commitPayload = lastEmitted<AdvancedDateInputCommitPayload<Date>>(
        wrapper,
        'inputCommit',
      )
      const closePayload = lastEmitted<AdvancedDateInputClosePayload<Date>>(
        wrapper,
        'draftClose',
      )

      expect(wrapper.emitted('cancel')).toBeUndefined()
      expect(toLocalYmd(value?.[0])).toBe('2026-01-20')
      expect(toLocalYmd(value?.[1])).toBe('2026-01-23')
      expect(closePayload?.reason).toBe('escape')
      expect(closePayload?.strategy).toBe('commit')
      expect(closePayload?.outcome).toBe('closed')
      expect(toLocalYmd(commitPayload?.draft.selection.start)).toBe(
        '2026-01-20',
      )
      expect(toLocalYmd(commitPayload?.draft.selection.end)).toBe('2026-01-23')
      expect(wrapper.emitted('update:menu')?.at(-1)).toEqual([false])

      wrapper.unmount()
    })
  })

  it("commits and closes overlay-driven dismissals when closeDraftStrategy is 'commit' and the draft is complete", async () => {
    await runWithDesktopWidth(async () => {
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: [
            new Date('2026-01-12T00:00:00.000Z'),
            new Date('2026-01-19T00:00:00.000Z'),
          ],
          closeDraftStrategy: 'commit',
          menu: true,
          month: 0,
          year: 2026,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      await wrapper.find('[data-date="2026-01-20"]').trigger('click')
      await wrapper.find('[data-date="2026-01-23"]').trigger('click')
      await wrapper.vm.$nextTick()
      wrapper
        .findComponent({ name: 'VMenu' })
        .vm.$emit('update:modelValue', false)
      await wrapper.vm.$nextTick()
      await flushPromises()

      const value = lastEmitted<[Date | null, Date | null]>(
        wrapper,
        'update:modelValue',
      )
      const commitPayload = lastEmitted<AdvancedDateInputCommitPayload<Date>>(
        wrapper,
        'inputCommit',
      )
      const closePayload = lastEmitted<AdvancedDateInputClosePayload<Date>>(
        wrapper,
        'draftClose',
      )

      expect(toLocalYmd(value?.[0])).toBe('2026-01-20')
      expect(toLocalYmd(value?.[1])).toBe('2026-01-23')
      expect(closePayload?.strategy).toBe('commit')
      expect(closePayload?.outcome).toBe('closed')
      expect(toLocalYmd(commitPayload?.draft.selection.start)).toBe(
        '2026-01-20',
      )
      expect(toLocalYmd(commitPayload?.draft.selection.end)).toBe('2026-01-23')
      expect(wrapper.emitted('update:menu')?.at(-1)).toEqual([false])

      wrapper.unmount()
    })
  })

  it("closes untouched overlays with closeDraftStrategy='commit' without emitting a redundant commit", async () => {
    await runWithDesktopWidth(async () => {
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: [
            new Date('2026-01-12T00:00:00.000Z'),
            new Date('2026-01-19T00:00:00.000Z'),
          ],
          closeDraftStrategy: 'commit',
          menu: true,
          month: 0,
          year: 2026,
        },
        attachTo: document.body,
        global: {
          stubs: {
            VMenu: menuStub,
          },
        },
      })

      wrapper
        .findComponent({ name: 'VMenu' })
        .vm.$emit('update:modelValue', false)
      await wrapper.vm.$nextTick()
      await flushPromises()

      const closePayload = lastEmitted<AdvancedDateInputClosePayload<Date>>(
        wrapper,
        'draftClose',
      )

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(wrapper.emitted('inputCommit')).toBeUndefined()
      expect(closePayload?.strategy).toBe('commit')
      expect(closePayload?.outcome).toBe('closed')
      expect(wrapper.emitted('update:menu')?.at(-1)).toEqual([false])

      wrapper.unmount()
    })
  })

  it('clears typed errors and restores the formatted value when inputReadonly is enabled later', async () => {
    const wrapper = render(VAdvancedDateInput, {
      props: {
        modelValue: new Date('2026-01-12T00:00:00.000Z'),
        inputReadonly: false,
        range: false,
      },
      attachTo: document.body,
    })

    const input = wrapper.find('input')

    await input.setValue('not a date')
    await input.trigger('blur')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Enter a valid date')

    await wrapper.setProps({ inputReadonly: true })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).not.toContain('Enter a valid date')
    expect(wrapper.find('input').attributes('readonly')).toBeDefined()
    expect(wrapper.find('input').element.value).toBe('Jan 12, 2026')

    wrapper.unmount()
  })

  for (const propName of ['readonly', 'inputReadonly', 'disabled'] as const) {
    it(`renders the committed text on mount when ${propName} is already true`, async () => {
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: new Date('2026-01-12T00:00:00.000Z'),
          text: 'Jan 20, 2026',
          range: false,
          [propName]: true,
        },
        attachTo: document.body,
      })

      const text = lastEmitted<string>(wrapper, 'update:text')

      expect(wrapper.find('input').element.value).toBe('Jan 12, 2026')
      expect(text).toBe('Jan 12, 2026')
      expect(publicHandle(wrapper).draft.source).toBe('picker')
      expect(publicHandle(wrapper).isDirty).toBe(false)
      expect(publicHandle(wrapper).draft.parseStatus).toBe('complete')

      wrapper.unmount()
    })
  }
})
