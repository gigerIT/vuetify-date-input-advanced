import type { ExtractPropTypes, PropType } from 'vue'

import type { AdvancedDateModel, PresetRange } from '@/types'

export type AdvancedDateDensity = 'default' | 'comfortable' | 'compact'
export type AdvancedDateMobilePresentation = 'fullscreen' | 'inline'

export const advancedDatePickerProps = {
  modelValue: {
    type: [Object, Array, Date, String, Number] as PropType<
      AdvancedDateModel<unknown>
    >,
    default: null,
  },
  range: {
    type: Boolean,
    default: true,
  },
  returnObject: Boolean,
  months: {
    type: Number,
    default: 2,
  },
  month: Number,
  year: Number,
  presets: Array as PropType<PresetRange<unknown>[]>,
  showPresets: {
    type: Boolean,
    default: true,
  },
  autoApply: {
    type: Boolean,
    default: true,
  },
  min: {
    type: [Object, Date, String, Number] as PropType<unknown>,
    default: null,
  },
  max: {
    type: [Object, Date, String, Number] as PropType<unknown>,
    default: null,
  },
  allowedDates: Function as PropType<(date: unknown) => boolean>,
  allowedStartDates: Function as PropType<(date: unknown) => boolean>,
  allowedEndDates: Function as PropType<(date: unknown) => boolean>,
  showWeekNumbers: Boolean,
  firstDayOfWeek: [String, Number] as PropType<string | number>,
  disabled: Boolean,
  readonly: Boolean,
  theme: String,
  rounded: {
    type: [String, Number, Boolean],
    default: undefined,
  },
  border: {
    type: [String, Number, Boolean],
    default: true,
  },
  elevation: {
    type: [String, Number],
    default: 2,
  },
  width: [String, Number],
  minWidth: [String, Number],
  maxWidth: [String, Number],
  density: {
    type: String as PropType<AdvancedDateDensity>,
    default: 'default',
  },
}

export const advancedDatePickerInternalProps = {
  mobilePresentation: {
    type: String as PropType<AdvancedDateMobilePresentation | null>,
    default: null,
    validator: (value: string | null) =>
      value === null || value === 'fullscreen' || value === 'inline',
  },
}

export const advancedDateInputProps = {
  menu: Boolean,
  inline: Boolean,
  label: String,
  placeholder: String,
  variant: {
    type: String,
    default: 'outlined',
  },
  hideDetails: {
    type: [Boolean, String] as PropType<boolean | 'auto'>,
    default: 'auto',
  },
  messages: {
    type: [String, Array] as PropType<string | string[]>,
    default: undefined,
  },
  error: Boolean,
  errorMessages: {
    type: [String, Array] as PropType<string | string[]>,
    default: undefined,
  },
  rules: {
    type: Array as PropType<readonly unknown[]>,
    default: () => [],
  },
  clearable: Boolean,
  focused: Boolean,
  prependInnerIcon: String,
  appendInnerIcon: {
    type: String,
    default: 'mdi-calendar',
  },
  ...advancedDatePickerProps,
  displayFormat: {
    type: String,
    default: 'fullDate',
  },
  rangeSeparator: {
    type: String,
    default: ' – ',
  },
  parseInput: Function as PropType<(value: string) => unknown | null>,
}

export type AdvancedDatePickerResolvedProps = Readonly<
  ExtractPropTypes<typeof advancedDatePickerProps>
> &
  Readonly<ExtractPropTypes<typeof advancedDatePickerInternalProps>>

export type AdvancedDateInputResolvedProps = Readonly<
  ExtractPropTypes<typeof advancedDateInputProps>
>

export function buildAdvancedDatePickerBindings(
  props: AdvancedDateInputResolvedProps,
  mobilePresentation: AdvancedDateMobilePresentation | null,
) {
  return {
    modelValue: props.modelValue,
    range: props.range,
    returnObject: props.returnObject,
    months: props.months,
    month: props.month,
    year: props.year,
    presets: props.presets,
    showPresets: props.showPresets,
    autoApply: props.autoApply,
    min: props.min,
    max: props.max,
    allowedDates: props.allowedDates,
    allowedStartDates: props.allowedStartDates,
    allowedEndDates: props.allowedEndDates,
    showWeekNumbers: props.showWeekNumbers,
    firstDayOfWeek: props.firstDayOfWeek,
    disabled: props.disabled,
    readonly: props.readonly,
    theme: props.theme,
    rounded: props.rounded,
    border: props.border,
    elevation: props.elevation,
    width: props.width,
    minWidth: props.minWidth,
    maxWidth: props.maxWidth,
    density: props.density,
    mobilePresentation,
  }
}
