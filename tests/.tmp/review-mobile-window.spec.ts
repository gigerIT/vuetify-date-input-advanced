import { describe, it, expect } from 'vitest'
import { VAdvancedDatePicker } from '@/components/VAdvancedDatePicker'
import { render } from '../render'

function toLocalYmd(date: Date | null | undefined) {
  if (!date) return null
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

function allowOnly(...allowedDates: string[]) {
  const allowed = new Set(allowedDates)
  return (date: unknown) => date instanceof Date && allowed.has(toLocalYmd(date) ?? '')
}

async function runWithWindowWidth(callback: () => Promise<void> | void, width = 375) {
  const originalWidth = window.innerWidth
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width })
  window.dispatchEvent(new Event('resize'))
  try {
    await callback()
  } finally {
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: originalWidth })
    window.dispatchEvent(new Event('resize'))
  }
}

function monthLabels(wrapper: ReturnType<typeof render>) {
  return wrapper.findAll('.v-advanced-date-picker__month-label-text').map((n) => n.text())
}

describe('review repro', () => {
  it('keeps selected month visible', async () => {
    await runWithWindowWidth(async () => {
      const wrapper = render(VAdvancedDatePicker, {
        props: {
          modelValue: null,
          month: 0,
          year: 2026,
          months: 1,
          autoApply: false,
          allowedStartDates: allowOnly('2026-01-20', '2026-02-10'),
          allowedEndDates: allowOnly('2026-01-25'),
          mobilePresentation: 'fullscreen',
        },
        attachTo: document.body,
      })
      try {
        await wrapper.vm.$nextTick()
        expect(monthLabels(wrapper)).toEqual(['January 2026', 'February 2026'])
        await wrapper.find('[data-date="2026-02-10"]').trigger('click')
        await wrapper.vm.$nextTick()
        expect(monthLabels(wrapper)).toEqual(['February 2026'])
      } finally {
        wrapper.unmount()
      }
    })
  })
})
