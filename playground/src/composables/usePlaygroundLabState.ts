import { computed, reactive, ref, watch } from 'vue'

import type {
  AdvancedDateInputFieldProps,
  AdvancedDateModel,
  PresetRange,
} from '@gigerit/vuetify-date-input-advanced'

import {
  allowOnly,
  coercePlaygroundModel,
  countCalendarNights,
  normalizeRangeModel,
  serializePreviewModel,
  toLocalYmd,
} from '../playgroundDateUtils'
import type {
  InlineDensity,
  PlaygroundBorderMode,
  PlaygroundConstraintMode,
  PlaygroundFieldPropsMode,
  PlaygroundHideDetailsMode,
  PlaygroundLabOptions,
  PlaygroundParseMode,
  PlaygroundPresetMode,
  PlaygroundPreviewMode,
  PlaygroundRoundedMode,
  PlaygroundRuleMode,
  PlaygroundThemeOverride,
  SelectOption,
} from '../playgroundTypes'

const previewModeOptions = [
  { title: 'Both previews', value: 'both' },
  { title: 'Input only', value: 'input' },
  { title: 'Picker only', value: 'picker' },
] satisfies SelectOption<PlaygroundPreviewMode>[]

const monthsOptions = [1, 2, 3, 4].map((value) => ({
  title: `${value} month${value === 1 ? '' : 's'}`,
  value,
})) satisfies SelectOption<number>[]

const monthNameOptions = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
].map((title, value) => ({
  title,
  value,
})) satisfies SelectOption<number>[]

const densityOptions = [
  { title: 'Default', value: 'default' },
  { title: 'Comfortable', value: 'comfortable' },
  { title: 'Compact', value: 'compact' },
] satisfies SelectOption<InlineDensity>[]

const presetModeOptions = [
  { title: 'Hidden', value: 'hidden' },
  { title: 'Built-in', value: 'default' },
  { title: 'Custom', value: 'custom' },
] satisfies SelectOption<PlaygroundPresetMode>[]

const firstDayOfWeekOptions = [
  { title: 'Sunday', value: 0 },
  { title: 'Monday', value: 1 },
  { title: 'Tuesday', value: 2 },
  { title: 'Wednesday', value: 3 },
  { title: 'Thursday', value: 4 },
  { title: 'Friday', value: 5 },
  { title: 'Saturday', value: 6 },
] satisfies SelectOption<number>[]

const closeDraftStrategyOptions = [
  { title: 'Revert', value: 'revert' },
  { title: 'Preserve', value: 'preserve' },
  { title: 'Commit', value: 'commit' },
] satisfies SelectOption<'revert' | 'preserve' | 'commit'>[]

const activeFieldOptions = [
  { title: 'Automatic', value: 'auto' },
  { title: 'Start field', value: 'start' },
  { title: 'End field', value: 'end' },
] satisfies SelectOption<'auto' | 'start' | 'end'>[]

const variantOptions = [
  { title: 'Outlined', value: 'outlined' },
  { title: 'Underlined', value: 'underlined' },
  { title: 'Filled', value: 'filled' },
  { title: 'Solo', value: 'solo' },
  { title: 'Plain', value: 'plain' },
] satisfies SelectOption<string>[]

const hideDetailsOptions = [
  { title: 'Auto', value: 'auto' },
  { title: 'Show details', value: 'show' },
  { title: 'Hide details', value: 'hide' },
] satisfies SelectOption<PlaygroundHideDetailsMode>[]

const themeOverrideOptions = [
  { title: 'Follow app theme', value: 'inherit' },
  { title: 'Force light', value: 'light' },
  { title: 'Force dark', value: 'dark' },
] satisfies SelectOption<PlaygroundThemeOverride>[]

const roundedOptions = [
  { title: 'Default', value: 'default' },
  { title: 'None', value: 'none' },
  { title: 'Large', value: 'lg' },
  { title: 'Pill', value: 'pill' },
  { title: '24px', value: 'numeric' },
] satisfies SelectOption<PlaygroundRoundedMode>[]

const borderOptions = [
  { title: 'Default', value: 'default' },
  { title: 'None', value: 'none' },
  { title: 'Small', value: 'sm' },
  { title: 'Large', value: 'lg' },
] satisfies SelectOption<PlaygroundBorderMode>[]

const constraintModeOptions = [
  { title: 'None', value: 'none' },
  { title: 'Min/max window', value: 'window' },
  { title: 'Weekdays only', value: 'weekdays' },
  { title: 'Monday start / Friday end', value: 'split-range' },
  { title: 'Sparse dates', value: 'sparse' },
] satisfies SelectOption<PlaygroundConstraintMode>[]

const parseModeOptions = [
  { title: 'Adapter default', value: 'adapter' },
  { title: 'YYYY-MM-DD', value: 'iso' },
  { title: 'MM/DD/YYYY', value: 'us' },
] satisfies SelectOption<PlaygroundParseMode>[]

const ruleModeOptions = [
  { title: 'None', value: 'none' },
  { title: 'Required', value: 'required' },
  { title: 'Min nights', value: 'min-nights' },
] satisfies SelectOption<PlaygroundRuleMode>[]

const fieldPropsModeOptions = [
  { title: 'Single field defaults', value: 'single' },
  { title: 'Split range fields', value: 'split' },
  { title: 'Readonly start field', value: 'split-readonly-start' },
  { title: 'Readonly end field', value: 'split-readonly-end' },
] satisfies SelectOption<PlaygroundFieldPropsMode>[]

const iconOptions = [
  { title: 'Default icon', value: '' },
  { title: 'Calendar', value: '$calendar' },
  { title: 'Previous', value: '$prev' },
  { title: 'Next', value: '$next' },
  { title: 'First page', value: 'mdi-page-first' },
  { title: 'Last page', value: 'mdi-page-last' },
  { title: 'Range calendar', value: 'mdi-calendar-range' },
  { title: 'Text box', value: 'mdi-form-textbox' },
] satisfies SelectOption<string>[]

function createValidDate(year: number, month: number, day: number) {
  const date = new Date(year, month, day)

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null
  }

  return date
}

function parseIsoDate(value: string) {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null

  return createValidDate(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  )
}

function parseUsDate(value: string) {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!match) return null

  return createValidDate(
    Number(match[3]),
    Number(match[1]) - 1,
    Number(match[2]),
  )
}

function trimToUndefined(value: string) {
  const trimmed = value.trim()

  return trimmed ? trimmed : undefined
}

function iconOrUndefined(value: string) {
  return trimToUndefined(value)
}

function roundedValue(mode: PlaygroundRoundedMode) {
  if (mode === 'default') return undefined
  if (mode === 'none') return false
  if (mode === 'numeric') return 24

  return mode
}

function borderValue(mode: PlaygroundBorderMode) {
  if (mode === 'default') return true
  if (mode === 'none') return false

  return mode
}

function hideDetailsValue(mode: PlaygroundHideDetailsMode) {
  if (mode === 'show') return false
  if (mode === 'hide') return true

  return 'auto' as const
}

function defaultRange(baseDate: Date) {
  const start = new Date(baseDate)
  const end = new Date(baseDate)
  end.setDate(start.getDate() + 6)

  return { start, end }
}

function defaultModel(
  baseDate: Date,
  options: Pick<PlaygroundLabOptions, 'range' | 'returnObject'>,
): AdvancedDateModel<Date> {
  const range = defaultRange(baseDate)

  if (!options.range) return range.start
  if (options.returnObject) {
    return {
      start: range.start,
      end: range.end,
    }
  }

  return [range.start, range.end] as const
}

function createCustomPresets(): PresetRange<Date>[] {
  return [
    {
      label: 'Weekend Escape',
      slot: 'highlight',
      value: () => {
        const start = new Date()
        const day = start.getDay()
        const delta = (5 - day + 7) % 7
        start.setDate(start.getDate() + delta)
        const end = new Date(start)
        end.setDate(start.getDate() + 2)

        return [start, end]
      },
    },
    {
      label: 'Two Weeks Out',
      value: () => {
        const start = new Date()
        start.setDate(start.getDate() + 14)
        const end = new Date(start)
        end.setDate(start.getDate() + 6)

        return [start, end]
      },
    },
  ]
}

function splitFieldProps(
  mode: PlaygroundFieldPropsMode,
): {
  startFieldProps?: AdvancedDateInputFieldProps
  endFieldProps?: AdvancedDateInputFieldProps
} {
  if (mode === 'single') return {}

  const startFieldProps: AdvancedDateInputFieldProps = {
    placeholder: 'Start date',
    name: 'playgroundStartDate',
    ariaLabel: 'Playground start date',
    readonly: mode === 'split-readonly-start',
  }
  const endFieldProps: AdvancedDateInputFieldProps = {
    placeholder: 'End date',
    name: 'playgroundEndDate',
    ariaLabel: 'Playground end date',
    readonly: mode === 'split-readonly-end',
  }

  return {
    startFieldProps,
    endFieldProps,
  }
}

function createDefaultOptions(baseDate: Date): PlaygroundLabOptions {
  return {
    previewMode: 'both',
    range: true,
    returnObject: false,
    months: 2,
    lockViewport: false,
    month: baseDate.getMonth(),
    year: baseDate.getFullYear(),
    autoApply: false,
    presetMode: 'default',
    showWeekNumbers: false,
    firstDayOfWeek: 0,
    disabled: false,
    readonly: false,
    inline: false,
    inputReadonly: false,
    menu: false,
    focused: false,
    activeField: 'auto',
    closeDraftStrategy: 'revert',
    label: 'Travel dates',
    placeholder: 'Choose a stay',
    title: 'Travel dates',
    titleStartDate: 'Departure',
    titleEndDate: 'Return',
    displayFormat: 'fullDate',
    rangeSeparator: ' – ',
    variant: 'outlined',
    hideDetails: 'auto',
    messagesText:
      'Use the controls to compare the text-input wrapper and the bare picker.',
    forceError: false,
    errorMessageText: 'Previewing an external validation error.',
    clearable: false,
    color: '',
    density: 'default',
    themeName: 'inherit',
    rounded: 'default',
    border: 'default',
    elevation: 2,
    width: '',
    minWidth: '',
    maxWidth: '',
    prevIcon: '$prev',
    nextIcon: '$next',
    prependInnerIcon: '',
    appendInnerIcon: '$calendar',
    constraintMode: 'none',
    parseMode: 'adapter',
    ruleMode: 'none',
    fieldPropsMode: 'split',
    draftText: '',
  }
}

export function usePlaygroundLabState() {
  const today = new Date()
  const customPresets = createCustomPresets()
  const yearOptions = [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1].map(
    (value) => ({
      title: String(value),
      value,
    }),
  ) satisfies SelectOption<number>[]

  const options = reactive(createDefaultOptions(today))
  const inputValue = ref<AdvancedDateModel<Date>>(
    defaultModel(today, {
      range: options.range,
      returnObject: options.returnObject,
    }),
  )
  const pickerValue = ref<AdvancedDateModel<Date>>(
    defaultModel(today, {
      range: options.range,
      returnObject: options.returnObject,
    }),
  )

  watch(
    () => [options.range, options.returnObject] as const,
    ([range, returnObject]) => {
      inputValue.value = coercePlaygroundModel(inputValue.value, {
        range,
        returnObject,
        fallbackDate: today,
      })
      pickerValue.value = coercePlaygroundModel(pickerValue.value, {
        range,
        returnObject,
        fallbackDate: today,
      })

      if (!range) {
        options.activeField = 'auto'
        options.fieldPropsMode = 'single'
      }
    },
  )

  watch(
    () => options.inline,
    (inline) => {
      if (inline) {
        options.menu = false
      }
    },
  )

  const constraintConfig = computed(() => {
    const minDate = new Date(today)
    minDate.setDate(today.getDate() - 20)
    const maxDate = new Date(today)
    maxDate.setDate(today.getDate() + 120)

    switch (options.constraintMode) {
      case 'window':
        return {
          label: 'Min/max window',
          min: minDate,
          max: maxDate,
        }
      case 'weekdays':
        return {
          label: 'Weekdays only',
          allowedDates: (date: Date) => ![0, 6].includes(date.getDay()),
        }
      case 'split-range':
        return {
          label: 'Monday start / Friday end',
          min: minDate,
          max: maxDate,
          allowedDates: (date: Date) => ![0, 6].includes(date.getDay()),
          allowedStartDates: (date: Date) => date.getDay() === 1,
          allowedEndDates: (date: Date) => date.getDay() === 5,
        }
      case 'sparse':
        return {
          label: 'Sparse dates',
          allowedDates: allowOnly(
            `${today.getFullYear()}-01-15`,
            `${today.getFullYear()}-02-05`,
            `${today.getFullYear()}-04-10`,
          ),
        }
      default:
        return {
          label: 'None',
        }
    }
  })

  const parseInput = computed(() => {
    if (options.parseMode === 'iso') return parseIsoDate
    if (options.parseMode === 'us') return parseUsDate

    return undefined
  })

  const rules = computed(() => {
    if (options.ruleMode === 'required') {
      return [
        (value: unknown) =>
          String(value ?? '').trim().length > 0 || 'Enter a date before applying.',
      ]
    }

    if (options.ruleMode === 'min-nights') {
      return [
        () => {
          if (!options.range) return 'Enable range mode to validate minimum nights.'

          const range = normalizeRangeModel(inputValue.value)
          if (!range.start || !range.end) {
            return 'Choose both dates to validate the stay length.'
          }

          return (
            countCalendarNights(range.start, range.end) >= 3 ||
            'Select at least 3 nights.'
          )
        },
      ]
    }

    return []
  })

  const fieldProps = computed(() => {
    if (!options.range) return {}

    return splitFieldProps(options.fieldPropsMode)
  })

  const showPresets = computed(
    () => options.range && options.presetMode !== 'hidden',
  )
  const presets = computed(() =>
    options.range && options.presetMode === 'custom'
      ? customPresets
      : undefined,
  )
  const activeField = computed(() =>
    options.activeField === 'auto' ? undefined : options.activeField,
  )
  const themeName = computed(() =>
    options.themeName === 'inherit' ? undefined : options.themeName,
  )

  const sharedPickerProps = computed(() => ({
    range: options.range,
    returnObject: options.returnObject,
    months: options.months,
    title: trimToUndefined(options.title),
    titleStartDate: trimToUndefined(options.titleStartDate),
    titleEndDate: trimToUndefined(options.titleEndDate),
    month: options.lockViewport ? options.month : undefined,
    year: options.lockViewport ? options.year : undefined,
    presets: presets.value,
    showPresets: showPresets.value,
    autoApply: options.autoApply,
    min: constraintConfig.value.min,
    max: constraintConfig.value.max,
    allowedDates: constraintConfig.value.allowedDates,
    allowedStartDates: constraintConfig.value.allowedStartDates,
    allowedEndDates: constraintConfig.value.allowedEndDates,
    showWeekNumbers: options.showWeekNumbers,
    firstDayOfWeek: options.firstDayOfWeek,
    prevIcon: iconOrUndefined(options.prevIcon) ?? '$prev',
    nextIcon: iconOrUndefined(options.nextIcon) ?? '$next',
    disabled: options.disabled,
    readonly: options.readonly,
    theme: themeName.value,
    rounded: roundedValue(options.rounded),
    border: borderValue(options.border),
    elevation: options.elevation,
    width: trimToUndefined(options.width),
    minWidth: trimToUndefined(options.minWidth),
    maxWidth: trimToUndefined(options.maxWidth),
    density: options.density,
  }))

  const inputProps = computed(() => ({
    ...sharedPickerProps.value,
    inline: options.inline,
    inputReadonly: options.inputReadonly,
    closeDraftStrategy: options.closeDraftStrategy,
    label: trimToUndefined(options.label),
    placeholder: trimToUndefined(options.placeholder),
    variant: options.variant,
    hideDetails: hideDetailsValue(options.hideDetails),
    messages: trimToUndefined(options.messagesText),
    error: options.forceError,
    errorMessages: options.forceError
      ? [options.errorMessageText]
      : undefined,
    rules: rules.value,
    clearable: options.clearable,
    color: trimToUndefined(options.color),
    focused: options.focused,
    activeField: activeField.value,
    prependInnerIcon: iconOrUndefined(options.prependInnerIcon),
    appendInnerIcon: iconOrUndefined(options.appendInnerIcon) ?? '$calendar',
    ...fieldProps.value,
    displayFormat: options.displayFormat,
    rangeSeparator: options.rangeSeparator,
    parseInput: parseInput.value,
  }))

  const output = computed(() => ({
    controls: {
      ...options,
    },
    input: {
      value: serializePreviewModel(inputValue.value),
      text: options.draftText,
      menu: options.menu,
      props: {
        ...inputProps.value,
        presets:
          options.range && options.presetMode === 'custom'
            ? customPresets.map((preset) => preset.label)
            : options.presetMode,
        parseMode: options.parseMode,
        ruleMode: options.ruleMode,
        constraintMode: options.constraintMode,
        startFieldProps: fieldProps.value.startFieldProps,
        endFieldProps: fieldProps.value.endFieldProps,
      },
    },
    picker: {
      value: serializePreviewModel(pickerValue.value),
      props: {
        ...sharedPickerProps.value,
        presets:
          options.range && options.presetMode === 'custom'
            ? customPresets.map((preset) => preset.label)
            : options.presetMode,
        constraintMode: options.constraintMode,
      },
    },
    helpers: {
      constraintSummary: constraintConfig.value.label,
      draftPreview: options.draftText,
      today: toLocalYmd(today),
    },
  }))

  function resetValues() {
    inputValue.value = defaultModel(today, {
      range: options.range,
      returnObject: options.returnObject,
    })
    pickerValue.value = defaultModel(today, {
      range: options.range,
      returnObject: options.returnObject,
    })
    options.draftText = ''
    options.menu = false
  }

  function resetControls() {
    Object.assign(options, createDefaultOptions(today))
    resetValues()
  }

  return {
    activeFieldOptions,
    closeDraftStrategyOptions,
    borderOptions,
    constraintModeOptions,
    densityOptions,
    fieldPropsModeOptions,
    firstDayOfWeekOptions,
    hideDetailsOptions,
    iconOptions,
    inputProps,
    inputValue,
    monthNameOptions,
    monthsOptions,
    options,
    output,
    parseModeOptions,
    pickerValue,
    presetModeOptions,
    previewModeOptions,
    resetControls,
    resetValues,
    roundedOptions,
    ruleModeOptions,
    sharedPickerProps,
    themeOverrideOptions,
    variantOptions,
    yearOptions,
    customPresets,
  }
}
