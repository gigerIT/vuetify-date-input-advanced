import { describe, expect, it } from 'vitest'

import { AdvancedDatePlugin } from '@/plugin'
import type { AdvancedDateModel } from '@/types'
import PlaygroundShowcase from '../../playground/src/components/PlaygroundShowcase.vue'

import { render } from '../render'

async function runWithWindowWidth(
  callback: () => Promise<void> | void,
  width = 375,
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

function createLocalDate(year: number, month: number, day: number) {
  return new Date(year, month, day)
}

function createShowcaseProps() {
  const start = createLocalDate(2026, 0, 12)
  const end = createLocalDate(2026, 0, 19)

  return {
    inlineInputProps: {
      inline: true,
      range: true,
      months: 2,
      autoApply: false,
      returnObject: false,
      showPresets: true,
      presets: undefined,
      showWeekNumbers: false,
      firstDayOfWeek: 0,
      density: 'default',
      disabled: false,
      readonly: false,
    },
    customPresets: [],
    minDate: createLocalDate(2026, 0, 1),
    maxDate: createLocalDate(2026, 4, 1),
    disableWeekends: (date: Date) => ![0, 6].includes(date.getDay()),
    allowMondays: (date: Date) => date.getDay() === 1,
    allowFridays: (date: Date) => date.getDay() === 5,
    inlineValue: [start, end] satisfies AdvancedDateModel<Date>,
    rangeValue: [start, end] satisfies AdvancedDateModel<Date>,
    singleValue: start satisfies AdvancedDateModel<Date>,
    constrainedValue: null as AdvancedDateModel<Date>,
    typedValue: null as AdvancedDateModel<Date>,
    pickerOnlyValue: start satisfies AdvancedDateModel<Date>,
    rangeMenu: false,
    presetMenu: false,
    customPresetMenu: false,
  }
}

describe('PlaygroundShowcase', () => {
  it('renders constrained navigation edge case demos', () => {
    const wrapper = render(PlaygroundShowcase, {
      props: createShowcaseProps(),
      global: {
        plugins: [AdvancedDatePlugin],
      },
    })

    expect(wrapper.text()).toContain('Constrained Navigation Edge Cases')
    expect(wrapper.text()).toContain('Hard min/max bounds')
    expect(wrapper.text()).toContain('Revealed month has no selectable dates')
    expect(wrapper.text()).toContain('Pending range end locks future navigation')
    expect(wrapper.text()).toContain('Gap months are not skipped')
    expect(wrapper.text()).toContain('Mobile fullscreen constrained scroll limit')
  })

  it('shows the expected disabled arrow states for each constrained demo', () => {
    const wrapper = render(PlaygroundShowcase, {
      props: createShowcaseProps(),
      global: {
        plugins: [AdvancedDatePlugin],
      },
    })

    const hardBounds = wrapper.get('[data-testid="playground-edge-hard-bounds"]')
    expect(
      hardBounds.find('button[aria-label="Previous month"]').attributes(
        'disabled',
      ),
    ).toBeDefined()
    expect(
      hardBounds.find('button[aria-label="Next month"]').attributes('disabled'),
    ).toBeDefined()

    const revealedMonth = wrapper.get(
      '[data-testid="playground-edge-revealed-month"]',
    )
    expect(
      revealedMonth.find('button[aria-label="Previous month"]').attributes(
        'disabled',
      ),
    ).toBeUndefined()
    expect(
      revealedMonth.find('button[aria-label="Next month"]').attributes(
        'disabled',
      ),
    ).toBeDefined()

    const draftRange = wrapper.get('[data-testid="playground-edge-draft-range"]')
    expect(
      draftRange.find('button[aria-label="Next month"]').attributes('disabled'),
    ).toBeDefined()

    const gapMonth = wrapper.get('[data-testid="playground-edge-gap-month"]')
    expect(
      gapMonth.find('button[aria-label="Next month"]').attributes('disabled'),
    ).toBeDefined()
  })

  it('shows the constrained mobile fullscreen month limit in the showcase', async () => {
    await runWithWindowWidth(async () => {
      const wrapper = render(PlaygroundShowcase, {
        props: createShowcaseProps(),
        global: {
          plugins: [AdvancedDatePlugin],
        },
      })

      try {
        await wrapper.vm.$nextTick()

        const mobileFullscreen = wrapper.get(
          '[data-testid="playground-edge-mobile-fullscreen"]',
        )

        expect(
          mobileFullscreen.find('.v-advanced-date-picker').classes(),
        ).toContain('v-advanced-date-picker--mobile-fullscreen')
        expect(
          mobileFullscreen
            .findAll('.v-advanced-date-picker__month-label-text')
            .map((node) => node.text()),
        ).toEqual(['January 2026', 'February 2026'])
      } finally {
        wrapper.unmount()
      }
    })
  })
})
