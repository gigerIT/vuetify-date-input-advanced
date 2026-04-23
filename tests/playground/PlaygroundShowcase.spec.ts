import { describe, expect, it } from 'vitest'

import { AdvancedDatePlugin } from '@/plugin'
import App from '../../playground/src/App.vue'
import PlaygroundAdvancedTab from '../../playground/src/components/PlaygroundAdvancedTab.vue'
import PlaygroundExamplesTab from '../../playground/src/components/PlaygroundExamplesTab.vue'
import PlaygroundLabTab from '../../playground/src/components/PlaygroundLabTab.vue'

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

function toLocalYmd(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function getFormValidation(wrapper: ReturnType<typeof render>) {
  return wrapper.get('[data-testid="playground-form-validation"]')
}

function parseFormValidationOutput(wrapper: ReturnType<typeof render>) {
  return JSON.parse(
    getFormValidation(wrapper).get('.form-validation-output').text(),
  ) as {
    touched: {
      paymentDate: boolean
      travelDates: boolean
    }
    submitCount: number
    menus: {
      paymentDate: boolean
      travelDates: boolean
    }
    errors: {
      paymentDate: string[]
      travelDates: string[]
    }
    text: {
      paymentDate: string
      travelDates: string
    }
    model: {
      paymentDate: string | null
      travelDates: [string | null, string | null]
    }
  }
}

function getPreviewModeButton(
  wrapper: ReturnType<typeof render>,
  label: string,
) {
  return wrapper
    .get('[data-testid="playground-lab-preview-mode"]')
    .findAll('.v-btn')
    .find((node) => node.text().includes(label))
}

describe('Playground showcase', () => {
  it('defaults to the examples tab and switches between tabs', async () => {
    const wrapper = render(App, {
      global: {
        plugins: [AdvancedDatePlugin],
      },
    })

    expect(
      wrapper.find('[data-testid="playground-tab-examples"]').exists(),
    ).toBe(true)
    expect(wrapper.find('[data-testid="playground-tab-lab"]').exists()).toBe(
      false,
    )

    const playgroundTab = wrapper
      .findAll('.v-tab')
      .find((node) => node.text().includes('Playground'))
    expect(playgroundTab).toBeDefined()

    await playgroundTab?.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="playground-tab-lab"]').exists()).toBe(
      true,
    )

    const advancedTab = wrapper
      .findAll('.v-tab')
      .find((node) => node.text().includes('Advanced'))
    expect(advancedTab).toBeDefined()

    await advancedTab?.trigger('click')
    await wrapper.vm.$nextTick()

    expect(
      wrapper.find('[data-testid="playground-tab-advanced"]').exists(),
    ).toBe(true)

    wrapper.unmount()
  })

  it('renders the clean examples tab without advanced debug sections', () => {
    const wrapper = render(PlaygroundExamplesTab, {
      global: {
        plugins: [AdvancedDatePlugin],
      },
    })

    expect(wrapper.text()).toContain('Single date input')
    expect(wrapper.text()).toContain('Range input')
    expect(wrapper.text()).toContain('Range input with built-in presets')
    expect(wrapper.text()).not.toContain('Bare picker')
    expect(wrapper.text()).not.toContain('Constrained navigation edge cases')
    expect(wrapper.text()).not.toContain('Live output')

    wrapper.unmount()
  })

  it('renders both playground previews by default and reacts to representative controls', async () => {
    const wrapper = render(PlaygroundLabTab, {
      global: {
        plugins: [AdvancedDatePlugin],
      },
    })

    expect(
      wrapper.find('[data-testid="playground-lab-input-preview"]').exists(),
    ).toBe(true)
    expect(
      wrapper.find('[data-testid="playground-lab-picker-preview"]').exists(),
    ).toBe(true)

    await getPreviewModeButton(wrapper, 'Picker only')?.trigger('click')
    await wrapper.vm.$nextTick()

    expect(
      wrapper.find('[data-testid="playground-lab-input-preview"]').exists(),
    ).toBe(false)
    expect(
      wrapper.find('[data-testid="playground-lab-picker-preview"]').exists(),
    ).toBe(true)

    await getPreviewModeButton(wrapper, 'Both previews')?.trigger('click')
    await wrapper.vm.$nextTick()

    await wrapper
      .get('[data-testid="playground-lab-range-switch"] input')
      .setValue(false)
    await wrapper.vm.$nextTick()

    const output = JSON.parse(
      wrapper.get('[data-testid="playground-lab-output"] pre').text(),
    ) as {
      controls: {
        inline: boolean
        range: boolean
        fieldPropsMode: string
      }
      input: {
        props: {
          range: boolean
        }
      }
    }

    expect(output.controls.inline).toBe(false)
    expect(output.controls.range).toBe(false)
    expect(output.controls.fieldPropsMode).toBe('single')
    expect(output.input.props.range).toBe(false)

    wrapper.unmount()
  })

  it('shows parent-driven validation errors in the advanced tab form demo', async () => {
    const wrapper = render(PlaygroundAdvancedTab, {
      attachTo: document.body,
      global: {
        plugins: [AdvancedDatePlugin],
      },
    })

    const formValidation = getFormValidation(wrapper)
    expect(parseFormValidationOutput(wrapper)).toMatchObject({
      touched: {
        paymentDate: false,
        travelDates: false,
      },
      submitCount: 0,
    })

    expect(formValidation.text()).toContain(
      'This example keeps validation in the parent',
    )

    await formValidation
      .get('[data-testid="playground-form-validation-form"]')
      .trigger('submit')
    await wrapper.vm.$nextTick()

    expect(parseFormValidationOutput(wrapper)).toMatchObject({
      touched: {
        paymentDate: true,
        travelDates: true,
      },
      submitCount: 1,
      errors: {
        paymentDate: ['Choose a payment date before submitting.'],
        travelDates: ['Choose both a start and end travel date.'],
      },
    })
    expect(formValidation.text()).toContain(
      'Fix the highlighted date fields before submitting the form.',
    )

    wrapper.unmount()
  })

  it('keeps the range field untouched while the picker is still completing a range', async () => {
    const wrapper = render(PlaygroundAdvancedTab, {
      attachTo: document.body,
      global: {
        plugins: [AdvancedDatePlugin],
      },
    })

    const formValidation = getFormValidation(wrapper)
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + 7)
    const targetIso = toLocalYmd(targetDate)

    await formValidation
      .get('input[aria-label="Travel start date"]')
      .trigger('click')
    await wrapper.vm.$nextTick()

    const targetButton = document.body.querySelector(
      `.v-overlay-container [data-date="${targetIso}"]`,
    ) as HTMLButtonElement | null

    expect(targetButton).not.toBeNull()

    targetButton?.click()
    await wrapper.vm.$nextTick()

    expect(parseFormValidationOutput(wrapper)).toMatchObject({
      touched: {
        travelDates: false,
      },
      menus: {
        travelDates: true,
      },
      text: {
        travelDates: expect.any(String),
      },
    })
    expect(parseFormValidationOutput(wrapper).text.travelDates).not.toBe('')
    expect(formValidation.text()).not.toContain(
      'Fix the highlighted date fields before submitting the form.',
    )

    wrapper.unmount()
  })

  it('shows the expected disabled arrow states for each constrained demo', () => {
    const wrapper = render(PlaygroundAdvancedTab, {
      global: {
        plugins: [AdvancedDatePlugin],
      },
    })

    const hardBounds = wrapper.get(
      '[data-testid="playground-edge-hard-bounds"]',
    )
    expect(
      hardBounds
        .find('button[aria-label="Previous month"]')
        .attributes('disabled'),
    ).toBeDefined()
    expect(
      hardBounds.find('button[aria-label="Next month"]').attributes('disabled'),
    ).toBeDefined()

    const revealedMonth = wrapper.get(
      '[data-testid="playground-edge-revealed-month"]',
    )
    expect(
      revealedMonth
        .find('button[aria-label="Previous month"]')
        .attributes('disabled'),
    ).toBeUndefined()
    expect(
      revealedMonth
        .find('button[aria-label="Next month"]')
        .attributes('disabled'),
    ).toBeDefined()

    const draftRange = wrapper.get(
      '[data-testid="playground-edge-draft-range"]',
    )
    expect(
      draftRange.find('button[aria-label="Next month"]').attributes('disabled'),
    ).toBeDefined()

    const gapMonth = wrapper.get('[data-testid="playground-edge-gap-month"]')
    expect(
      gapMonth.find('button[aria-label="Next month"]').attributes('disabled'),
    ).toBeDefined()

    wrapper.unmount()
  })

  it('shows the constrained mobile fullscreen month limit in the advanced tab', async () => {
    await runWithWindowWidth(async () => {
      const wrapper = render(PlaygroundAdvancedTab, {
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
