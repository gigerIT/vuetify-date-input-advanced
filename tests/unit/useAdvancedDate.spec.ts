import { describe, expect, it } from 'vitest'
import { formatDisplayValue, parseInputValue } from '@/composables/useAdvancedDate'

const adapter = {
  date(value?: unknown) {
    if (value == null) return new Date('2026-01-01T00:00:00.000Z')
    return new Date(String(value))
  },
  parseISO(value: string) {
    return new Date(`${value}T00:00:00.000Z`)
  },
  isValid(value: unknown) {
    return value instanceof Date && !Number.isNaN(value.getTime())
  },
  format(value: unknown) {
    if (!(value instanceof Date)) return ''
    return value.toISOString().slice(0, 10)
  },
  isSameDay(a: unknown, b: unknown) {
    if (!(a instanceof Date) || !(b instanceof Date)) return false
    return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10)
  },
  startOfDay(value: unknown) {
    if (value instanceof Date) return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()))
    return new Date('invalid')
  },
  addDays(value: unknown, amount: number) {
    if (!(value instanceof Date)) return new Date('invalid')
    const copy = new Date(value)
    copy.setUTCDate(copy.getUTCDate() + amount)
    return copy
  },
  isAfter(a: unknown, b: unknown) {
    if (!(a instanceof Date) || !(b instanceof Date)) return false
    return a.getTime() > b.getTime()
  },
} as const

describe('useAdvancedDate', () => {
  it('formats a range value', () => {
    const value = [
      new Date('2026-01-10T00:00:00.000Z'),
      new Date('2026-01-11T00:00:00.000Z'),
      new Date('2026-01-12T00:00:00.000Z'),
    ]

    const text = formatDisplayValue(adapter as never, value, {
      range: true,
      separator: ' - ',
      displayFormat: 'yyyy-mm-dd',
    })

    expect(text).toBe('2026-01-10 - 2026-01-12')
  })

  it('parses range text', () => {
    const value = parseInputValue(adapter as never, '2026-01-10 - 2026-01-12', {
      range: true,
      separator: ' - ',
      inputFormat: 'yyyy-mm-dd',
    })

    expect(Array.isArray(value)).toBe(true)
    expect((value as Date[]).length).toBe(3)
  })
})
