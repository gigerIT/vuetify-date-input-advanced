import { h } from 'vue'
import { describe, expect, it, vi } from 'vitest'

import { VAdvancedDateInput } from '@/components/VAdvancedDateInput'

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

describe('VAdvancedDateInput', () => {
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

  it('forwards blur hooks without breaking typed input parsing', async () => {
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

    const emissions = wrapper.emitted('update:modelValue') ?? []
    const finalValue = emissions.at(-1)?.[0] as Date | null

    expect(onBlur).toHaveBeenCalledTimes(1)
    expect(finalValue).toBeInstanceOf(Date)

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

    wrapper.findComponent({ name: 'VTextField' }).vm.$emit(
      'click:clear',
      new MouseEvent('click'),
    )
    await wrapper.vm.$nextTick()

    expect(onClickClear).toHaveBeenCalledTimes(1)
    expect(wrapper.find('input').element.value).toBe('')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([null])
    expect(wrapper.emitted('update:menu')?.at(-1)).toEqual([false])

    wrapper.unmount()
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

    expect(wrapper.text()).toContain('Enter a valid date range')

    ;(vuetify as any).locale.current.value = 'fr'
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Saisissez une plage de dates valide')

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
})
