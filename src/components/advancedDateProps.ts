import type { ExtractPropTypes, PropType } from 'vue'

import type {
  AdvancedDateInputField,
  AdvancedDateInputFieldProps,
  AdvancedDateInputCloseStrategy,
  AdvancedDateIconValue,
  AdvancedDateModel,
  NormalizedRange,
  PresetRange,
} from '@/types'

export type AdvancedDateDensity = 'default' | 'comfortable' | 'compact'
export type AdvancedDateMobilePresentation = 'fullscreen' | 'inline'
type AdvancedDateSelectionChangeOrigin = 'external' | 'internal'

const advancedDateIconPropType = [
  String,
  Array,
  Object,
  Function,
] as PropType<AdvancedDateIconValue>

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
  title: String,
  titleStartDate: String,
  titleEndDate: String,
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
  prevIcon: {
    type: advancedDateIconPropType,
    default: '$prev',
  },
  nextIcon: {
    type: advancedDateIconPropType,
    default: '$next',
  },
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
  selectionChangeOrigin: {
    type: String as PropType<AdvancedDateSelectionChangeOrigin>,
    default: 'external',
    validator: (value: string) => value === 'external' || value === 'internal',
  },
  onDraftChange: Function as PropType<
    ((value: NormalizedRange<unknown>) => void) | undefined
  >,
  onEscapeKey: Function as PropType<(() => void) | undefined>,
}

export const advancedDateInputProps = {
  menu: Boolean,
  inline: Boolean,
  inputReadonly: Boolean,
  text: String,
  closeDraftStrategy: {
    type: String as PropType<AdvancedDateInputCloseStrategy>,
    default: 'revert',
    validator: (value: string) =>
      value === 'revert' || value === 'preserve' || value === 'commit',
  },
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
  color: String,
  focused: Boolean,
  activeField: {
    type: String as PropType<AdvancedDateInputField | undefined>,
    default: undefined,
    validator: (value: string | undefined) =>
      value === undefined || value === 'start' || value === 'end',
  },
  prependInnerIcon: advancedDateIconPropType,
  appendInnerIcon: {
    type: advancedDateIconPropType,
    default: '$calendar',
  },
  startFieldProps: Object as PropType<AdvancedDateInputFieldProps>,
  endFieldProps: Object as PropType<AdvancedDateInputFieldProps>,
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
    title: props.title,
    titleStartDate: props.titleStartDate,
    titleEndDate: props.titleEndDate,
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
    prevIcon: props.prevIcon,
    nextIcon: props.nextIcon,
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
