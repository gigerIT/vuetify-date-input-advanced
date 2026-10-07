import { describe, expect, it, vi } from 'vitest'

import { VAdvancedDateInput } from '@/components/VAdvancedDateInput'
import { VAdvancedDatePicker } from '@/components/VAdvancedDatePicker'

import { ref } from 'vue'

import { render } from '../render'

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

describe('navigation across unavailable months', () => {
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
        await wrapper.get('button[aria-label="Next month"]').trigger('click')
        const marchDate = wrapper.get(`[data-date="${target}"]`)
        expect(marchDate.attributes('disabled')).toBeUndefined()
        await marchDate.trigger('click')
        expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toEqual(value)
      } finally {
        wrapper.unmount()
      }
    },
  )

  it('shows non-consecutive available months together and jumps backward', async () => {
    const wrapper = render(VAdvancedDatePicker, {
      props: {
        modelValue: null,
        range: false,
        month: 9,
        year: 2026,
        months: 2,
        min: new Date(2026, 9, 1),
        max: new Date(2027, 2, 31),
        allowedDates: allowOnly('2026-10-10', '2027-03-10'),
      },
    })
    try {
      expect(
        wrapper
          .findAll('.v-advanced-date-picker__month-label-text')
          .map((n) => n.text()),
      ).toEqual(['October 2026', 'March 2027'])
      expect(wrapper.get('.v-advanced-date-picker__gap').text()).toContain(
        'November 2026 – February 2027',
      )
      expect(
        wrapper.get('button[aria-label="Next month"]').attributes('disabled'),
      ).toBeDefined()
      await wrapper.setProps({ months: 1, month: 2, year: 2027 })
      await wrapper.get('button[aria-label="Previous month"]').trigger('click')
      await vi.waitFor(() =>
        expect(
          wrapper
            .findAll('.v-advanced-date-picker__month-label-text')
            .map((n) => n.text()),
        ).toEqual(['October 2026']),
      )
      expect(wrapper.emitted('update:month')?.at(-1)).toEqual([9])
      expect(wrapper.emitted('update:year')?.at(-1)).toEqual([2026])
    } finally {
      wrapper.unmount()
    }
  })

  it('recomputes the navigation target when adjacent availability changes', async () => {
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
      ).toBeUndefined()
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
        expect(labels).toEqual(['October 2026', 'March 2027'])
        expect(wrapper.get('.v-advanced-date-picker__gap').text()).toContain(
          'November 2026 – February 2027',
        )
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
  it('continues searching across a gap longer than one batch', async () => {
    const wrapper = render(VAdvancedDatePicker, {
      props: {
        modelValue: null,
        range: false,
        month: 9,
        year: 2026,
        months: 1,
        min: new Date(2026, 9, 1),
        max: new Date(2028, 2, 31),
        allowedDates: allowOnly('2026-10-10', '2028-03-10'),
      },
    })
    try {
      expect(wrapper.text()).toContain(
        'No later dates found through October 2027',
      )
      await wrapper.get('[data-search-direction="next"]').trigger('click')
      const date = wrapper.get('[data-date="2028-03-10"]')
      expect(date.attributes('disabled')).toBeUndefined()
      await date.trigger('click')
      expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toEqual(
        new Date(2028, 2, 10),
      )
    } finally {
      wrapper.unmount()
    }
  })

  it('uses PageDown and PageUp to focus available dates across a gap', async () => {
    const wrapper = render(VAdvancedDatePicker, {
      props: {
        modelValue: null,
        range: false,
        month: 9,
        year: 2026,
        months: 1,
        allowedDates: allowOnly('2026-10-10', '2027-03-10'),
      },
      attachTo: document.body,
    })
    try {
      const october = wrapper.get<HTMLButtonElement>('[data-date="2026-10-10"]')
      october.element.focus()
      await october.trigger('keydown', { key: 'PageDown' })
      await vi.waitFor(() =>
        expect(document.activeElement?.getAttribute('data-date')).toBe(
          '2027-03-10',
        ),
      )
      await wrapper
        .get('[data-date="2027-03-10"]')
        .trigger('keydown', { key: 'PageUp' })
      await vi.waitFor(() =>
        expect(document.activeElement?.getAttribute('data-date')).toBe(
          '2026-10-10',
        ),
      )
    } finally {
      wrapper.unmount()
    }
  })

  it('updates cached availability when a reactive callback changes without replacement', async () => {
    const available = ref(new Set(['2026-10-10', '2027-03-10']))
    const wrapper = render(VAdvancedDatePicker, {
      props: {
        modelValue: null,
        range: false,
        month: 9,
        year: 2026,
        months: 2,
        allowedDates: (date: Date) =>
          available.value.has(
            [
              date.getFullYear(),
              String(date.getMonth() + 1).padStart(2, '0'),
              String(date.getDate()).padStart(2, '0'),
            ].join('-'),
          ),
      },
    })
    try {
      expect(
        wrapper
          .findAll('.v-advanced-date-picker__month-label-text')
          .map((n) => n.text()),
      ).toEqual(['October 2026', 'March 2027'])
      available.value.add('2026-12-10')
      await wrapper.vm.$nextTick()
      await vi.waitFor(() =>
        expect(
          wrapper
            .findAll('.v-advanced-date-picker__month-label-text')
            .map((n) => n.text()),
        ).toEqual(['October 2026', 'December 2026']),
      )
      available.value.delete('2026-12-10')
      await wrapper.vm.$nextTick()
      await vi.waitFor(() =>
        expect(
          wrapper
            .findAll('.v-advanced-date-picker__month-label-text')
            .map((n) => n.text()),
        ).toEqual(['October 2026', 'March 2027']),
      )
    } finally {
      wrapper.unmount()
    }
  })

  it('clamps the initial view and follows changed min/max bounds', async () => {
    const wrapper = render(VAdvancedDatePicker, {
      props: {
        modelValue: null,
        range: false,
        month: 9,
        year: 2026,
        months: 2,
        min: new Date(2027, 2, 1),
        max: new Date(2027, 2, 31),
        allowedDates: allowOnly('2027-03-10', '2027-06-10'),
      },
    })
    try {
      expect(
        wrapper
          .findAll('.v-advanced-date-picker__month-label-text')
          .map((n) => n.text()),
      ).toEqual(['March 2027'])
      await wrapper.setProps({
        min: new Date(2027, 5, 1),
        max: new Date(2027, 5, 30),
      })
      await vi.waitFor(() =>
        expect(
          wrapper
            .findAll('.v-advanced-date-picker__month-label-text')
            .map((n) => n.text()),
        ).toEqual(['June 2027']),
      )
      expect(
        wrapper.get('button[aria-label="Next month"]').attributes('disabled'),
      ).toBeDefined()
    } finally {
      wrapper.unmount()
    }
  })

  it('retains the end field month when a sparse range is opened and focused', async () => {
    const wrapper = render(VAdvancedDatePicker, {
      props: {
        modelValue: [new Date(2026, 9, 10), new Date(2028, 2, 10)],
        month: 9,
        year: 2026,
        months: 2,
        selectionTargetField: 'end',
        allowedDates: allowOnly('2026-10-10', '2028-03-10'),
      },
      attachTo: document.body,
    })
    try {
      expect(wrapper.find('[data-date="2028-03-10"]').exists()).toBe(true)
      await wrapper.vm.focusActiveDate()
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-date="2028-03-10"]').exists()).toBe(true)
      await wrapper.setProps({ selectionTargetField: 'start' })
      await vi.waitFor(() =>
        expect(
          wrapper
            .findAll('.v-advanced-date-picker__month-label-text')
            .map((n) => n.text())[0],
        ).toBe('October 2026'),
      )
    } finally {
      wrapper.unmount()
    }
  })

  it.each(['next', 'prev'] as const)(
    'continues mobile searches %s across a multi-year gap',
    async (direction) => {
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
          month: direction === 'next' ? 9 : 2,
          year: direction === 'next' ? 2026 : 2028,
          months: 1,
          mobilePresentation: 'fullscreen',
          min: new Date(2026, 9, 1),
          max: new Date(2028, 2, 31),
          allowedDates: allowOnly('2026-10-10', '2028-03-10'),
        },
        attachTo: document.body,
      })
      try {
        await wrapper
          .get(`[data-search-direction="${direction}"]`)
          .trigger('click')
        await wrapper.vm.$nextTick()
        expect(
          wrapper
            .findAll('.v-advanced-date-picker__month-label-text')
            .map((n) => n.text()),
        ).toEqual(['October 2026', 'March 2028'])
        expect(wrapper.get('.v-advanced-date-picker__gap').text()).toContain(
          'November 2026 – February 2028',
        )
        const target = direction === 'next' ? '2028-03-10' : '2026-10-10'
        expect(
          wrapper.get(`[data-date="${target}"]`).attributes('disabled'),
        ).toBeUndefined()
        expect(wrapper.find('[data-search-direction="next"]').exists()).toBe(
          false,
        )
        expect(wrapper.find('[data-search-direction="prev"]').exists()).toBe(
          false,
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

  it('completes a range across a gap using end-date availability after the first pick', async () => {
    const wrapper = render(VAdvancedDatePicker, {
      props: {
        modelValue: null,
        month: 9,
        year: 2026,
        months: 2,
        allowedStartDates: allowOnly('2026-10-10', '2027-05-10'),
        allowedEndDates: allowOnly('2027-03-10'),
        min: new Date(2026, 9, 1),
        max: new Date(2027, 5, 1),
      },
    })
    try {
      expect(
        wrapper
          .findAll('.v-advanced-date-picker__month-label-text')
          .map((n) => n.text()),
      ).toEqual(['October 2026', 'May 2027'])
      await wrapper.get('[data-date="2026-10-10"]').trigger('click')
      await vi.waitFor(() =>
        expect(
          wrapper
            .findAll('.v-advanced-date-picker__month-label-text')
            .map((n) => n.text()),
        ).toEqual(['October 2026', 'March 2027']),
      )
      expect(wrapper.get('[data-date="2026-10-10"]').classes()).toContain(
        'v-advanced-date-picker__day--selected-disabled',
      )
      await wrapper.get('[data-date="2027-03-10"]').trigger('click')
      expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toEqual([
        new Date(2026, 9, 10),
        new Date(2027, 2, 10),
      ])
    } finally {
      wrapper.unmount()
    }
  })

  it('bounds the work when an unbounded availability callback rejects every date', async () => {
    const allowedDates = vi.fn(() => false)
    const wrapper = render(VAdvancedDatePicker, {
      props: {
        modelValue: null,
        range: false,
        month: 9,
        year: 2026,
        months: 2,
        allowedDates,
      },
    })
    try {
      expect(allowedDates.mock.calls.length).toBeLessThan(850)
      expect(wrapper.find('[data-search-direction="next"]').exists()).toBe(true)
      expect(wrapper.find('[data-search-direction="prev"]').exists()).toBe(true)
      const calls = allowedDates.mock.calls.length
      await wrapper.get('[data-search-direction="next"]').trigger('click')
      expect(allowedDates.mock.calls.length - calls).toBeLessThan(400)
      expect(wrapper.text()).toContain(
        'No later dates found through October 2028',
      )
      expect(wrapper.find('[data-search-direction="next"]').exists()).toBe(true)
    } finally {
      wrapper.unmount()
    }
  })
  it.each(['desktop', 'inline', 'fullscreen'] as const)(
    'selects across a gap through the %s input wrapper',
    async (mode) => {
      const originalWidth = window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        writable: true,
        value: mode === 'desktop' ? 1440 : 375,
      })
      window.dispatchEvent(new Event('resize'))
      const wrapper = render(VAdvancedDateInput, {
        props: {
          modelValue: null,
          range: false,
          month: 9,
          year: 2026,
          months: 2,
          inline: mode === 'inline',
          menu: true,
          min: new Date(2026, 9, 1),
          max: new Date(2027, 2, 31),
          allowedDates: allowOnly('2026-10-10', '2027-03-10'),
        },
        global: {
          stubs: {
            VMenu: {
              template:
                '<div><slot name="activator" :props="{}" /><slot /></div>',
            },
            VDialog: { template: '<div><slot /></div>' },
          },
        },
        attachTo: document.body,
      })
      try {
        expect(
          wrapper
            .findAll('.v-advanced-date-picker__month-label-text')
            .map((n) => n.text()),
        ).toEqual(['October 2026', 'March 2027'])
        await wrapper.get('[data-date="2027-03-10"]').trigger('click')
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

  it('localizes gap labels and lets consumers override the new messages', async () => {
    const wrapper = render(VAdvancedDatePicker, {
      locale: 'de',
      props: {
        modelValue: null,
        range: false,
        month: 9,
        year: 2026,
        months: 2,
        allowedDates: allowOnly('2026-10-10', '2027-03-10'),
      },
      vuetify: {
        locale: {
          messages: {
            de: {
              dateInputAdvanced: {
                navigation: { unavailablePeriod: 'Keine Termine: {0}' },
              },
            },
          },
        },
      },
    })
    try {
      expect(wrapper.get('.v-advanced-date-picker__gap').text()).toBe(
        'Keine Termine: November 2026 – Februar 2027',
      )
      expect(wrapper.get('[data-search-direction="next"]').text()).toBe(
        'Spätere Daten suchen',
      )
    } finally {
      wrapper.unmount()
    }
  })

  it('keeps mobile windowing bounded and restores the gap when scrolling back', async () => {
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
        mobilePresentation: 'fullscreen',
        min: new Date(2026, 9, 1),
        max: new Date(2030, 0, 1),
        allowedDates: (date: Date) =>
          date.getDate() === 10 &&
          ((date.getFullYear() === 2026 && date.getMonth() === 9) ||
            (date.getFullYear() >= 2027 &&
              date.getMonth() % 2 === 0 &&
              date >= new Date(2027, 2, 1))),
      },
      attachTo: document.body,
    })
    try {
      const container = wrapper.get<HTMLElement>(
        '.v-advanced-date-picker__months',
      )
      const calendars = () => wrapper.findAll('.v-advanced-date-picker__month')
      Object.defineProperties(container.element, {
        clientHeight: { configurable: true, value: 360 },
        scrollHeight: {
          configurable: true,
          get: () => calendars().length * 360,
        },
      })
      async function scroll(bottom: boolean) {
        for (const node of calendars()) {
          Object.defineProperties(node.element, {
            offsetTop: {
              configurable: true,
              get: () =>
                calendars().findIndex(
                  (entry) => entry.element === node.element,
                ) * 360,
            },
            offsetHeight: { configurable: true, value: 300 },
          })
        }
        container.element.scrollTop = bottom
          ? container.element.scrollHeight - 360
          : 0
        await container.trigger('scroll')
        await new Promise((resolve) => requestAnimationFrame(resolve))
        await wrapper.vm.$nextTick()
      }
      await wrapper.vm.$nextTick()
      expect(calendars()).toHaveLength(7)
      await scroll(true)
      expect(calendars()).toHaveLength(10)
      await scroll(true)
      expect(calendars()).toHaveLength(10)
      expect(wrapper.find('[data-date="2026-10-10"]').exists()).toBe(false)
      await scroll(false)
      expect(calendars()).toHaveLength(10)
      expect(wrapper.find('[data-date="2026-10-10"]').exists()).toBe(true)
      expect(wrapper.get('.v-advanced-date-picker__gap').text()).toContain(
        'November 2026 – February 2027',
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
  })
  it('keeps a year keyboard jump distinct from skipping unavailable months', async () => {
    const wrapper = render(VAdvancedDatePicker, {
      props: {
        modelValue: null,
        range: false,
        month: 9,
        year: 2026,
        months: 1,
      },
      attachTo: document.body,
    })
    try {
      const date = wrapper.get<HTMLButtonElement>('[data-date="2026-10-10"]')
      date.element.focus()
      await date.trigger('keydown', { key: 'PageDown', shiftKey: true })
      await vi.waitFor(() =>
        expect(document.activeElement?.getAttribute('data-date')).toBe(
          '2027-10-10',
        ),
      )
      expect(wrapper.get('.v-advanced-date-picker__live').text()).not.toContain(
        'No available dates',
      )
    } finally {
      wrapper.unmount()
    }
  })
})
