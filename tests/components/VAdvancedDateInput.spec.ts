import { describe, expect, it } from 'vitest'

import { VAdvancedDateInput } from '@/components/VAdvancedDateInput'

import { render } from '../render'

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
