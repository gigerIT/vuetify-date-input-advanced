import { describe, expect, it } from 'vitest'

import {
  dateInputAdvancedDe,
  dateInputAdvancedEn,
  dateInputAdvancedFr,
  dateInputAdvancedIt,
} from '@/locale'

function collectPaths(
  value: object,
  prefix = '',
): string[] {
  return Object.entries(value as Record<string, unknown>).flatMap(
    ([key, entry]) => {
    const path = prefix ? `${prefix}.${key}` : key

    if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
        return collectPaths(entry, path)
    }

    return [path]
    },
  )
}

describe('dateInputAdvanced locale messages', () => {
  it('keeps the same key shape across all shipped locales', () => {
    const englishPaths = collectPaths(dateInputAdvancedEn)

    expect(collectPaths(dateInputAdvancedDe)).toEqual(englishPaths)
    expect(collectPaths(dateInputAdvancedFr)).toEqual(englishPaths)
    expect(collectPaths(dateInputAdvancedIt)).toEqual(englishPaths)
  })
})
