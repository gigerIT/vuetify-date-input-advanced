import { describe, expect, it } from 'vitest'

import { VAdvancedDatePicker } from '@/components/VAdvancedDatePicker'

import { render } from './render'

function allowOnly(...dates: string[]) {
  const allowed = new Set(dates)
  return (date: unknown) => {
    if (!(date instanceof Date)) return false
    const ymd = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-')
    return allowed.has(ymd)
  }
}

describe('allowed-date gap reproduction', () => {
  it.each([
    { name: 'March 2027', target: '2027-03-10', value: new Date(2027, 2, 10) },
    {
      name: 'December 2026 (one empty month)',
      target: '2026-12-10',
      value: new Date(2026, 11, 10),
    },
    {
      name: 'November 2026 (no-gap control)',
      target: '2026-11-10',
      value: new Date(2026, 10, 10),
    },
  ])(
    'lets a desktop user reach $name from October 2026',
    async ({ target, value }) => {
      const wrapper = render(VAdvancedDatePicker, {
        props: {
          modelValue: null,
          range: false,
          month: 9,
          year: 2026,
          months: 1,
          allowedDates: allowOnly('2026-10-10', target),
        },
      })

      try {
        expect(
          wrapper.get('[data-date="2026-10-10"]').attributes('disabled'),
        ).toBeUndefined()
        for (
          let step = 0;
          step < 5 && !wrapper.find(`[data-date="${target}"]`).exists();
          step++
        ) {
          const next = wrapper.get('button[aria-label="Next month"]')
          expect(
            next.attributes('disabled'),
            `${target} is still available beyond the gap`,
          ).toBeUndefined()
          await next.trigger('click')
        }
        const marchDate = wrapper.get(`[data-date="${target}"]`)
        expect(marchDate.attributes('disabled')).toBeUndefined()
        await marchDate.trigger('click')
        expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toEqual(value)
      } finally {
        wrapper.unmount()
      }
    },
  )

  it.each([
    {
      name: 'two visible months',
      months: 2,
      range: false,
      reverse: false,
      bounded: false,
    },
    {
      name: 'range mode',
      months: 1,
      range: true,
      reverse: false,
      bounded: false,
    },
    {
      name: 'reverse navigation',
      months: 1,
      range: false,
      reverse: true,
      bounded: false,
    },
    {
      name: 'explicit min/max',
      months: 1,
      range: false,
      reverse: false,
      bounded: true,
    },
  ])(
    'allows navigation across the gap with $name',
    async ({ months, range, reverse, bounded }) => {
      const wrapper = render(VAdvancedDatePicker, {
        props: {
          modelValue: null,
          month: reverse ? 2 : 9,
          year: reverse ? 2027 : 2026,
          months,
          range,
          allowedDates: allowOnly('2026-10-10', '2027-03-10'),
          ...(bounded
            ? { min: new Date(2026, 9, 1), max: new Date(2027, 2, 31) }
            : {}),
        },
      })
      try {
        expect(
          wrapper
            .get(`button[aria-label="${reverse ? 'Previous' : 'Next'} month"]`)
            .attributes('disabled'),
        ).toBeUndefined()
      } finally {
        wrapper.unmount()
      }
    },
  )

  it('unblocks navigation when only the adjacent month availability changes', async () => {
    const wrapper = render(VAdvancedDatePicker, {
      props: {
        modelValue: null,
        range: false,
        month: 9,
        year: 2026,
        months: 1,
        allowedDates: allowOnly('2026-10-10', '2027-03-10'),
      },
    })
    try {
      expect(
        wrapper.get('button[aria-label="Next month"]').attributes('disabled'),
      ).toBeDefined()
      await wrapper.setProps({
        allowedDates: allowOnly('2026-10-10', '2026-11-10', '2027-03-10'),
      })
      expect(
        wrapper.get('button[aria-label="Next month"]').attributes('disabled'),
      ).toBeUndefined()
      await wrapper.get('button[aria-label="Next month"]').trigger('click')
      expect(
        wrapper.get('[data-date="2026-11-10"]').attributes('disabled'),
      ).toBeUndefined()
    } finally {
      wrapper.unmount()
    }
  })

  it('selects the March date when March is opened directly with the same allowedDates callback', async () => {
    const wrapper = render(VAdvancedDatePicker, {
      props: {
        modelValue: null,
        range: false,
        month: 2,
        year: 2027,
        months: 1,
        allowedDates: allowOnly('2026-10-10', '2027-03-10'),
      },
    })
    try {
      const date = wrapper.get('[data-date="2027-03-10"]')
      expect(date.attributes('disabled')).toBeUndefined()
      await date.trigger('click')
      expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toEqual(
        new Date(2027, 2, 10),
      )
    } finally {
      wrapper.unmount()
    }
  })

  it.each(['inline', 'fullscreen'] as const)(
    'lets a mobile %s user reach March after the gap',
    async (mobilePresentation) => {
      const originalWidth = window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        writable: true,
        value: 375,
      })
      window.dispatchEvent(new Event('resize'))
      const wrapper = render(VAdvancedDatePicker, {
        props: {
          modelValue: null,
          range: false,
          month: 9,
          year: 2026,
          months: 1,
          mobilePresentation,
          allowedDates: allowOnly('2026-10-10', '2027-03-10'),
        },
        attachTo: document.body,
      })
      try {
        await wrapper.vm.$nextTick()
        expect(wrapper.get('.v-advanced-date-picker').classes()).toContain(
          'v-advanced-date-picker--mobile-scroll',
        )
        const container = wrapper.get('.v-advanced-date-picker__months')
        Object.defineProperties(container.element, {
          scrollTop: { configurable: true, writable: true, value: 500 },
          scrollHeight: { configurable: true, value: 1000 },
          clientHeight: { configurable: true, value: 500 },
        })
        await container.trigger('scroll')
        await new Promise((resolve) => requestAnimationFrame(resolve))
        await wrapper.vm.$nextTick()
        const labels = wrapper
          .findAll('.v-advanced-date-picker__month-label-text')
          .map((node) => node.text())
        expect(labels).toContain('March 2027')
        const date = wrapper.get('[data-date="2027-03-10"]')
        expect(date.attributes('disabled')).toBeUndefined()
        await date.trigger('click')
        expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toEqual(
          new Date(2027, 2, 10),
        )
      } finally {
        wrapper.unmount()
        Object.defineProperty(window, 'innerWidth', {
          configurable: true,
          writable: true,
          value: originalWidth,
        })
        window.dispatchEvent(new Event('resize'))
      }
    },
  )
})
