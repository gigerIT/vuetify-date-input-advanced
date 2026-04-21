import { compileString } from 'sass'
import { describe, expect, it } from 'vitest'

const loadPaths = [process.cwd(), 'node_modules']

function compileStyles(source: string) {
  return compileString(source, { loadPaths }).css
}

function extractRule(css: string, selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = new RegExp(`${escapedSelector}\\s*\\{[^}]+\\}`).exec(css)

  if (!match) {
    throw new Error(`Could not find CSS rule for ${selector}`)
  }

  return match[0]
}

describe('Sass variables', () => {
  it('emits default picker variables from the styles entry', () => {
    const css = compileStyles("@use 'styles';")
    const dayRule = extractRule(css, '.v-advanced-date-picker__day')
    const weekdayRule = extractRule(css, '.v-advanced-date-picker__weekday')
    const weekNumberRule = extractRule(css, '.v-advanced-date-picker__week-number')

    expect(css).toContain('--v-advanced-date-cell-size: 44px;')
    expect(css).toContain(
      '--v-advanced-date-day-size: calc(var(--v-advanced-date-cell-size) - 2px);',
    )
    expect(css).toContain(
      '--v-advanced-date-day-inset: calc((var(--v-advanced-date-cell-size) - var(--v-advanced-date-day-size)) / 2);',
    )
    expect(css).toContain('--v-advanced-date-month-slide-duration: 0.36s;')
    expect(css).toContain(
      '--v-advanced-date-month-slide-easing: cubic-bezier(0.4, 0, 0.2, 1);',
    )
    expect(css).toContain('--v-advanced-date-preset-width: 220px;')
    expect(dayRule).toContain('font-size: 0.875rem;')
    expect(dayRule).toContain('font-weight: 500;')
    expect(weekdayRule).toContain(
      'color: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 30%, rgb(var(--v-theme-on-surface-variant)) 40%);',
    )
    expect(weekdayRule).not.toContain('opacity:')
    expect(weekNumberRule).toContain(
      'color: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 30%, rgb(var(--v-theme-on-surface-variant)) 40%);',
    )
    expect(weekNumberRule).not.toContain('opacity:')
  })

  it('allows package variable overrides through the styles entry', () => {
    const css = compileStyles(`
      @use 'styles' with (
        $advanced-date-picker-cell-size: 48px,
        $advanced-date-picker-month-slide-duration: 0.32s,
        $advanced-date-picker-month-slide-easing: linear,
        $advanced-date-picker-preset-width: 260px,
        $advanced-date-picker-day-font-weight: 600,
        $advanced-date-picker-week-label-color: rgb(10, 20, 30)
      );
    `)
    const dayRule = extractRule(css, '.v-advanced-date-picker__day')
    const weekdayRule = extractRule(css, '.v-advanced-date-picker__weekday')
    const weekNumberRule = extractRule(css, '.v-advanced-date-picker__week-number')

    expect(css).toContain('--v-advanced-date-cell-size: 48px;')
    expect(css).toContain('--v-advanced-date-month-slide-duration: 0.32s;')
    expect(css).toContain('--v-advanced-date-month-slide-easing: linear;')
    expect(css).toContain('--v-advanced-date-preset-width: 260px;')
    expect(dayRule).toContain('font-weight: 600;')
    expect(weekdayRule).toContain('color: rgb(10, 20, 30);')
    expect(weekdayRule).not.toContain('opacity:')
    expect(weekNumberRule).toContain('color: rgb(10, 20, 30);')
    expect(weekNumberRule).not.toContain('opacity:')
  })

  it('inherits defaults from configured Vuetify Sass variables', () => {
    const css = compileStyles(`
      @use 'vuetify/settings' with (
        $date-picker-month-day-size: 50px,
        $button-font-weight: 700
      );

      @use 'styles';
    `)
    const dayRule = extractRule(css, '.v-advanced-date-picker__day')

    expect(css).toContain('--v-advanced-date-cell-size: 50px;')
    expect(dayRule).toContain('font-weight: 700;')
  })
})
