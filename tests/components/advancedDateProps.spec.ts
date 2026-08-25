import { describe, expect, it } from 'vitest'

import {
  advancedDatePickerProps,
  buildAdvancedDatePickerBindings,
  type AdvancedDateInputResolvedProps,
} from '@/components/advancedDateProps'

describe('advanced date prop bindings', () => {
  it('derives input pass-through bindings from the picker prop map', () => {
    const pickerValues = Object.fromEntries(
      Object.keys(advancedDatePickerProps).map((key, index) => [
        key,
        `picker-value-${index}`,
      ]),
    )
    const props = {
      ...pickerValues,
      label: 'Input-only label',
    } as unknown as AdvancedDateInputResolvedProps
    const bindings = buildAdvancedDatePickerBindings(props, 'fullscreen')
    const pickerBindingKeys = Object.keys(advancedDatePickerProps).filter(
      (key) => key !== 'modelValue',
    )

    expect(Object.keys(bindings).sort()).toEqual(
      [...pickerBindingKeys, 'mobilePresentation'].sort(),
    )
    pickerBindingKeys.forEach((key) => {
      expect(bindings).toHaveProperty(
        key,
        props[key as keyof AdvancedDateInputResolvedProps],
      )
    })
    expect(bindings).not.toHaveProperty('modelValue')
    expect(bindings).not.toHaveProperty('label')
    expect(bindings).not.toHaveProperty('selectionChangeOrigin')
    expect(bindings.mobilePresentation).toBe('fullscreen')
  })
})
