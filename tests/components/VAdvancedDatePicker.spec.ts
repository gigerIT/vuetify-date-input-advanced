import { describe, expect, it } from 'vitest'

import { VAdvancedDatePicker } from '@/components/VAdvancedDatePicker'

import { render } from '../render'

describe('VAdvancedDatePicker', () => {
  it('emits a completed range after two valid clicks', async () => {
    const wrapper = render(VAdvancedDatePicker, {
      props: {
        modelValue: null,
        month: 0,
        year: 2026,
      },
    })

    const buttons = wrapper.findAll('button[data-date]:not([disabled])')

    await buttons[0].trigger('click')
    await buttons[5].trigger('click')

    const emissions = wrapper.emitted('update:modelValue') ?? []
    const finalValue = emissions.at(-1)?.[0] as [Date | null, Date | null]

    expect(Array.isArray(finalValue)).toBe(true)
    expect(finalValue[0]).toBeInstanceOf(Date)
    expect(finalValue[1]).toBeInstanceOf(Date)
  })

  it('emits presetSelect when a preset is clicked', async () => {
    const wrapper = render(VAdvancedDatePicker, {
      props: {
        modelValue: null,
        month: 0,
        year: 2026,
        presets: [
          {
            label: 'Launch Window',
            value: () => [new Date('2026-01-10'), new Date('2026-01-15')],
          },
        ],
      },
    })

    await wrapper.find('.v-advanced-date-picker__preset').trigger('click')

    expect(wrapper.emitted('presetSelect')).toHaveLength(1)
  })
})
