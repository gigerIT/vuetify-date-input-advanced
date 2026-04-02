import { describe, expect, it } from 'vitest'

import { VAdvancedDateInput } from '@/components/VAdvancedDateInput'

import { render } from '../render'

describe('VAdvancedDateInput', () => {
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
})
