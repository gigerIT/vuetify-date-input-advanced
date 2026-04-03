import { describe, expect, it } from 'vitest'

import { VAdvancedDatePicker } from '@/components/VAdvancedDatePicker'

import { render } from '../render'

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

  it('uses allowedStartDates before a range start is chosen', () => {
    const wrapper = render(VAdvancedDatePicker, {
      props: {
        modelValue: null,
        month: 0,
        year: 2026,
        allowedStartDates: allowOnly('2026-01-05'),
      },
    })

    expect(
      wrapper.find('[data-date="2026-01-04"]').attributes('disabled'),
    ).toBeDefined()
    expect(
      wrapper.find('[data-date="2026-01-05"]').attributes('disabled'),
    ).toBeUndefined()
  })

  it('uses allowedEndDates while completing a range', async () => {
    const wrapper = render(VAdvancedDatePicker, {
      props: {
        modelValue: null,
        month: 0,
        year: 2026,
        allowedStartDates: allowOnly('2026-01-05'),
        allowedEndDates: allowOnly('2026-01-09'),
      },
    })

    await wrapper.find('[data-date="2026-01-05"]').trigger('click')
    await wrapper.vm.$nextTick()

    expect(
      wrapper.find('[data-date="2026-01-08"]').attributes('disabled'),
    ).toBeDefined()
    expect(
      wrapper.find('[data-date="2026-01-09"]').attributes('disabled'),
    ).toBeUndefined()
  })

  it('validates the second click against the ordered range endpoints', async () => {
    const wrapper = render(VAdvancedDatePicker, {
      props: {
        modelValue: null,
        month: 0,
        year: 2026,
        allowedStartDates: allowOnly('2026-01-05', '2026-01-10'),
        allowedEndDates: allowOnly('2026-01-10'),
      },
    })

    await wrapper.find('[data-date="2026-01-10"]').trigger('click')
    await wrapper.vm.$nextTick()

    expect(
      wrapper.find('[data-date="2026-01-05"]').attributes('disabled'),
    ).toBeUndefined()
    expect(
      wrapper.find('[data-date="2026-01-06"]').attributes('disabled'),
    ).toBeDefined()

    await wrapper.find('[data-date="2026-01-05"]').trigger('click')

    const emissions = wrapper.emitted('update:modelValue') ?? []
    const finalValue = emissions.at(-1)?.[0] as [Date | null, Date | null]

    expect(toLocalYmd(finalValue[0])).toBe('2026-01-05')
    expect(toLocalYmd(finalValue[1])).toBe('2026-01-10')
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

  for (const propName of ['readonly', 'disabled'] as const) {
    it(`prevents date selection when ${propName} is enabled`, async () => {
      const wrapper = render(VAdvancedDatePicker, {
        props: {
          modelValue: null,
          month: 0,
          year: 2026,
          [propName]: true,
        },
        attachTo: document.body,
      })

      const day = wrapper.find('[data-date="2026-01-02"]')

      expect(day.attributes('disabled')).toBeDefined()

      await day.trigger('keydown', { key: 'Enter' })

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()

      wrapper.unmount()
    })
  }

  it('disables presets that violate start or end constraints', async () => {
    const wrapper = render(VAdvancedDatePicker, {
      props: {
        modelValue: null,
        month: 0,
        year: 2026,
        presets: [
          {
            label: 'Blocked',
            value: () => [new Date('2026-01-08'), new Date('2026-01-10')],
          },
        ],
        allowedStartDates: allowOnly('2026-01-09'),
        allowedEndDates: allowOnly('2026-01-10'),
      },
    })

    expect(wrapper.find('.v-advanced-date-picker__preset').classes()).toContain(
      'v-list-item--disabled',
    )

    await wrapper.find('.v-advanced-date-picker__preset').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('presetSelect')).toBeUndefined()
  })

  it('hides adjacent month days from the visible grids', () => {
    const wrapper = render(VAdvancedDatePicker, {
      props: {
        modelValue: null,
        month: 0,
        year: 2026,
      },
    })

    const months = wrapper.findAll('.v-advanced-date-picker__month')
    const january = months[0]

    expect(january.find('[data-date="2025-12-31"]').exists()).toBe(false)
    expect(january.find('[data-date="2026-02-01"]').exists()).toBe(false)
    expect(january.findAll('button[data-date]').length).toBe(31)
    expect(
      january.findAll('.v-advanced-date-picker__day-placeholder').length,
    ).toBeGreaterThan(0)
  })

  it('renders only the week rows each month needs', () => {
    const cases = [
      { month: 1, year: 2026, rows: 4 },
      { month: 0, year: 2026, rows: 5 },
      { month: 7, year: 2026, rows: 6 },
    ]

    for (const testCase of cases) {
      const wrapper = render(VAdvancedDatePicker, {
        props: {
          modelValue: null,
          months: 1,
          month: testCase.month,
          year: testCase.year,
        },
      })

      expect(wrapper.findAll('.v-advanced-date-picker__week').length).toBe(
        testCase.rows,
      )

      wrapper.unmount()
    }
  })

  it('applies firstDayOfWeek to the weekday order and grid alignment', () => {
    const wrapper = render(VAdvancedDatePicker, {
      props: {
        modelValue: null,
        months: 1,
        month: 0,
        year: 2026,
        firstDayOfWeek: 1,
      },
    })

    const weekdays = wrapper
      .findAll('.v-advanced-date-picker__weekday')
      .map((node) => node.text())
    const firstWeek = wrapper.findAll('.v-advanced-date-picker__week')[0]
    const firstWeekCells = firstWeek.findAll(
      '.v-advanced-date-picker__day-cell',
    )

    expect(weekdays[0]).toBe('M')
    expect(firstWeekCells[3].find('[data-date="2026-01-01"]').exists()).toBe(
      true,
    )
  })

  it('renders fixed navigation buttons outside the animated month labels', () => {
    const wrapper = render(VAdvancedDatePicker, {
      props: {
        modelValue: null,
        month: 0,
        year: 2026,
      },
    })

    const labels = wrapper.findAll('.v-advanced-date-picker__month-label')
    const months = wrapper.find('.v-advanced-date-picker__months')

    expect(wrapper.find('.v-advanced-date-picker__header').exists()).toBe(false)
    expect(months.find('.v-advanced-date-picker__nav--prev').exists()).toBe(
      true,
    )
    expect(months.find('.v-advanced-date-picker__nav--next').exists()).toBe(
      true,
    )
    expect(labels[0].find('.v-advanced-date-picker__nav--prev').exists()).toBe(
      false,
    )
    expect(
      labels.at(-1)?.find('.v-advanced-date-picker__nav--next').exists(),
    ).toBe(false)
  })

  it('does not reuse the clicked previous button as the next button after navigation', async () => {
    const wrapper = render(VAdvancedDatePicker, {
      props: {
        modelValue: null,
        month: 0,
        year: 2026,
      },
      attachTo: document.body,
    })

    const previousButton = wrapper.find('button[aria-label="Previous month"]')
    const previousElement = previousButton.element

    await previousButton.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('December 2025')
    expect(wrapper.text()).toContain('January 2026')

    const nextButton = wrapper.find('button[aria-label="Next month"]')

    expect(nextButton.element).not.toBe(previousElement)

    wrapper.unmount()
  })

  it('emits month updates when navigating with the controls', async () => {
    const wrapper = render(VAdvancedDatePicker, {
      props: {
        modelValue: null,
        month: 0,
        year: 2026,
      },
    })

    await wrapper.find('button[aria-label="Next month"]').trigger('click')

    expect(wrapper.emitted('update:month')).toEqual([[1]])
    expect(wrapper.emitted('update:year')).toBeUndefined()
  })

  it('does not echo synced month props back to the parent', async () => {
    const wrapper = render(VAdvancedDatePicker, {
      props: {
        modelValue: null,
        month: 0,
        year: 2026,
      },
    })

    await wrapper.setProps({ month: 2 })

    expect(wrapper.emitted('update:month')).toBeUndefined()
    expect(wrapper.emitted('update:year')).toBeUndefined()
  })

  it('does not emit month updates when only the visible month count changes', async () => {
    const wrapper = render(VAdvancedDatePicker, {
      props: {
        modelValue: null,
        month: 0,
        year: 2026,
        months: 2,
      },
    })

    await wrapper.setProps({ months: 3 })

    expect(wrapper.emitted('update:month')).toBeUndefined()
    expect(wrapper.emitted('update:year')).toBeUndefined()
  })

  it('moves focus with arrow keys and selects with enter', async () => {
    const wrapper = render(VAdvancedDatePicker, {
      props: {
        modelValue: null,
        month: 0,
        year: 2026,
      },
      attachTo: document.body,
    })

    const first = wrapper.find('[data-date="2026-01-01"]')

    await first.trigger('focus')
    await first.trigger('keydown', { key: 'ArrowRight' })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(
      (document.activeElement as HTMLElement | null)?.getAttribute('data-date'),
    ).toBe('2026-01-02')

    await wrapper
      .find('[data-date="2026-01-02"]')
      .trigger('keydown', { key: 'Enter' })

    const emissions = wrapper.emitted('update:modelValue') ?? []
    const finalValue = emissions.at(-1)?.[0] as [Date | null, Date | null]

    expect(toLocalYmd(finalValue[0])).toBe('2026-01-02')
    expect(finalValue[1]).toBeNull()

    wrapper.unmount()
  })

  it('aligns Home and End keyboard navigation with firstDayOfWeek', async () => {
    const wrapper = render(VAdvancedDatePicker, {
      props: {
        modelValue: null,
        months: 1,
        month: 0,
        year: 2026,
        firstDayOfWeek: 1,
      },
      attachTo: document.body,
    })

    const first = wrapper.find('[data-date="2026-01-01"]')

    await first.trigger('focus')
    await first.trigger('keydown', { key: 'End' })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(
      (document.activeElement as HTMLElement | null)?.getAttribute('data-date'),
    ).toBe('2026-01-04')

    await wrapper
      .find('[data-date="2026-01-04"]')
      .trigger('keydown', { key: 'Home' })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(
      (document.activeElement as HTMLElement | null)?.getAttribute('data-date'),
    ).toBe('2025-12-29')

    wrapper.unmount()
  })

  it('focuses a date after navigating to a different month view', async () => {
    const wrapper = render(VAdvancedDatePicker, {
      props: {
        modelValue: null,
        month: 0,
        year: 2026,
      },
      attachTo: document.body,
    })

    await wrapper.vm.focusDate(new Date('2026-03-05'))
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(
      (document.activeElement as HTMLElement | null)?.getAttribute('data-date'),
    ).toBe('2026-03-05')
    expect(wrapper.text()).toContain('March 2026')
    expect(wrapper.text()).toContain('April 2026')

    wrapper.unmount()
  })

  it('resets the range on the third click', async () => {
    const wrapper = render(VAdvancedDatePicker, {
      props: {
        modelValue: null,
        month: 0,
        year: 2026,
      },
    })

    await wrapper.find('[data-date="2026-01-02"]').trigger('click')
    await wrapper.find('[data-date="2026-01-07"]').trigger('click')
    await wrapper.find('[data-date="2026-01-12"]').trigger('click')

    const emissions = wrapper.emitted('update:modelValue') ?? []
    const finalValue = emissions.at(-1)?.[0] as [Date | null, Date | null]

    expect(toLocalYmd(finalValue[0])).toBe('2026-01-12')
    expect(finalValue[1]).toBeNull()
  })

  it('returns to start constraints after a completed range', async () => {
    const wrapper = render(VAdvancedDatePicker, {
      props: {
        modelValue: null,
        month: 0,
        year: 2026,
        allowedStartDates: allowOnly('2026-01-10', '2026-01-12'),
        allowedEndDates: allowOnly('2026-01-15'),
      },
    })

    await wrapper.find('[data-date="2026-01-10"]').trigger('click')
    await wrapper.find('[data-date="2026-01-15"]').trigger('click')
    await wrapper.vm.$nextTick()

    expect(
      wrapper.find('[data-date="2026-01-11"]').attributes('disabled'),
    ).toBeDefined()

    await wrapper.find('[data-date="2026-01-12"]').trigger('click')

    const emissions = wrapper.emitted('update:modelValue') ?? []
    const finalValue = emissions.at(-1)?.[0] as [Date | null, Date | null]

    expect(toLocalYmd(finalValue[0])).toBe('2026-01-12')
    expect(finalValue[1]).toBeNull()
  })

  it('emits the local calendar days for april ranges', async () => {
    const wrapper = render(VAdvancedDatePicker, {
      props: {
        modelValue: null,
        month: 3,
        year: 2026,
      },
    })

    await wrapper.find('[data-date="2026-04-01"]').trigger('click')
    await wrapper.find('[data-date="2026-04-10"]').trigger('click')

    const emissions = wrapper.emitted('update:modelValue') ?? []
    const finalValue = emissions.at(-1)?.[0] as [Date | null, Date | null]

    expect(toLocalYmd(finalValue[0])).toBe('2026-04-01')
    expect(toLocalYmd(finalValue[1])).toBe('2026-04-10')
  })

  it('includes the preselected start day in the initial range highlight', () => {
    const wrapper = render(VAdvancedDatePicker, {
      props: {
        modelValue: [new Date(2026, 0, 2, 12), new Date(2026, 0, 5, 12)],
        months: 1,
        month: 0,
        year: 2026,
      },
    })

    const inRangeDays = wrapper.findAll(
      '.v-advanced-date-picker__day-cell--in-range button[data-date]',
    )

    expect(inRangeDays.map((node) => node.attributes('data-date'))).toEqual([
      '2026-01-02',
      '2026-01-03',
      '2026-01-04',
      '2026-01-05',
    ])
  })

  it('keeps the range preview visible while crossing gaps between weeks', async () => {
    const wrapper = render(VAdvancedDatePicker, {
      props: {
        modelValue: null,
        month: 0,
        year: 2026,
      },
    })

    await wrapper.find('[data-date="2026-01-02"]').trigger('click')
    await wrapper.find('[data-date="2026-01-10"]').trigger('mouseenter')

    expect(
      wrapper.findAll('.v-advanced-date-picker__day-cell--preview').length,
    ).toBeGreaterThan(0)

    await wrapper.find('[data-date="2026-01-10"]').trigger('mouseleave')

    expect(
      wrapper.findAll('.v-advanced-date-picker__day-cell--preview').length,
    ).toBeGreaterThan(0)

    await wrapper.find('.v-advanced-date-picker__months').trigger('mouseleave')

    expect(
      wrapper.findAll('.v-advanced-date-picker__day-cell--preview').length,
    ).toBe(0)
  })

  it('suppresses the range preview for invalid hovered completions', async () => {
    const wrapper = render(VAdvancedDatePicker, {
      props: {
        modelValue: null,
        month: 0,
        year: 2026,
        allowedStartDates: allowOnly('2026-01-05'),
        allowedEndDates: allowOnly('2026-01-09'),
      },
    })

    await wrapper.find('[data-date="2026-01-05"]').trigger('click')
    await wrapper.find('[data-date="2026-01-08"]').trigger('mouseenter')

    expect(
      wrapper.findAll('.v-advanced-date-picker__day-cell--preview').length,
    ).toBe(0)

    await wrapper.find('[data-date="2026-01-09"]').trigger('mouseenter')

    expect(
      wrapper.findAll('.v-advanced-date-picker__day-cell--preview').length,
    ).toBeGreaterThan(0)
  })

  it('shows a Vuetify ripple when pressing a date', async () => {
    const wrapper = render(VAdvancedDatePicker, {
      props: {
        modelValue: null,
        month: 0,
        year: 2026,
      },
      attachTo: document.body,
    })

    const day = wrapper.find('[data-date="2026-01-02"]')

    await day.trigger('mousedown', { clientX: 12, clientY: 12 })

    expect(day.find('.v-ripple__container').exists()).toBe(true)

    wrapper.unmount()
  })
})
