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
