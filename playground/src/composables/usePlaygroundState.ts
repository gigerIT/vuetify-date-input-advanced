import { computed, ref, watch } from 'vue'
import { useLocale, useTheme } from 'vuetify'

import type {
  AdvancedDateModel,
  PresetRange,
} from '@gigerit/vuetify-date-input-advanced'

import type {
  InlineDensity,
  InlineOptions,
  InlinePresetMode,
  PlaygroundLocale,
  SelectOption,
  ThemeMode,
} from '../playgroundTypes'
import {
  normalizePlaygroundLocale,
  normalizeThemeMode,
  writePlaygroundLocalePreference,
  writeThemeModePreference,
} from '../playgroundPreferences'

const localeOptions = [
  { title: 'English', value: 'en' },
  { title: 'Français', value: 'fr' },
  { title: 'Deutsch', value: 'de' },
  { title: 'Italiano', value: 'it' },
  { title: 'Čeština', value: 'cs' },
  { title: 'Lietuvių', value: 'lt' },
] satisfies SelectOption<PlaygroundLocale>[]

const themeModeOptions = [
  { title: 'Light', value: 'light' },
  { title: 'Dark', value: 'dark' },
  { title: 'System', value: 'system' },
] satisfies SelectOption<ThemeMode>[]

const monthOptions = [1, 2, 3, 4].map((value) => ({
  title: `${value} month${value === 1 ? '' : 's'}`,
  value,
})) satisfies SelectOption<number>[]

const presetModeOptions = [
  { title: 'Hidden', value: 'hidden' },
  { title: 'Built-in', value: 'default' },
  { title: 'Custom', value: 'custom' },
] satisfies SelectOption<InlinePresetMode>[]

const firstDayOfWeekOptions = [
  { title: 'Sunday', value: 0 },
  { title: 'Monday', value: 1 },
  { title: 'Tuesday', value: 2 },
  { title: 'Wednesday', value: 3 },
  { title: 'Thursday', value: 4 },
  { title: 'Friday', value: 5 },
  { title: 'Saturday', value: 6 },
] satisfies SelectOption<number>[]

const densityOptions = [
  { title: 'Default', value: 'default' },
  { title: 'Comfortable', value: 'comfortable' },
  { title: 'Compact', value: 'compact' },
] satisfies SelectOption<InlineDensity>[]

function toLocalYmd(date: Date | null | undefined) {
  if (!date) return null

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function serializePreviewModel(value: AdvancedDateModel<Date>) {
  if (value == null) return null
  if (Array.isArray(value)) return value.map((item) => toLocalYmd(item))
  if (value instanceof Date) return toLocalYmd(value)
  if ('start' in value && 'end' in value) {
    return {
      start: toLocalYmd(value.start),
      end: toLocalYmd(value.end),
    }
  }

  return {
    value,
  }
}

function cloneDate(date: Date | null | undefined) {
  return date ? new Date(date) : null
}

function normalizeInlineValue(value: AdvancedDateModel<Date>) {
  if (Array.isArray(value)) {
    return {
      start: cloneDate(value[0]),
      end: cloneDate(value[1]),
    }
  }

  if (value instanceof Date) {
    return {
      start: cloneDate(value),
      end: null,
    }
  }

  if (
    value &&
    typeof value === 'object' &&
    'start' in value &&
    'end' in value
  ) {
    return {
      start: cloneDate(value.start),
      end: cloneDate(value.end),
    }
  }

  return {
    start: null,
    end: null,
  }
}

export function usePlaygroundState() {
  const { current: currentLocale } = useLocale()
  const theme = useTheme()

  const playgroundLocale = computed<PlaygroundLocale>({
    get: () => normalizePlaygroundLocale(currentLocale.value),
    set: (value) => {
      currentLocale.value = value
    },
  })
  const themeMode = computed<ThemeMode>({
    get: () => normalizeThemeMode(theme.global.name.value),
    set: (value) => {
      theme.global.name.value = value
    },
  })

  watch(
    playgroundLocale,
    (value) => {
      writePlaygroundLocalePreference(value)
    },
    { immediate: true },
  )

  watch(
    themeMode,
    (value) => {
      writeThemeModePreference(value)
    },
    { immediate: true },
  )

  const today = new Date()
  const inSevenDays = new Date(today)
  inSevenDays.setDate(today.getDate() + 6)

  const minDate = new Date(today)
  minDate.setDate(today.getDate() - 20)

  const maxDate = new Date(today)
  maxDate.setDate(today.getDate() + 120)

  const rangeValue = ref<AdvancedDateModel<Date>>([today, inSevenDays])
  const singleValue = ref<AdvancedDateModel<Date>>(today)
  const inlineValue = ref<AdvancedDateModel<Date>>([today, inSevenDays])
  const constrainedValue = ref<AdvancedDateModel<Date>>(null)
  const typedValue = ref<AdvancedDateModel<Date>>(null)
  const pickerOnlyValue = ref<AdvancedDateModel<Date>>(today)
  const rangeMenu = ref(false)
  const presetMenu = ref(false)
  const customPresetMenu = ref(false)

  const inlineOptions = ref<InlineOptions>({
    range: true,
    months: 2,
    autoApply: false,
    returnObject: false,
    presetMode: 'default',
    showWeekNumbers: false,
    firstDayOfWeek: 0,
    density: 'default',
    disabled: false,
    readonly: false,
  })

  const customPresets: PresetRange<Date>[] = [
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

  function disableWeekends(date: Date) {
    const day = date.getDay()
    return day !== 0 && day !== 6
  }

  function allowMondays(date: Date) {
    return date.getDay() === 1
  }

  function allowFridays(date: Date) {
    return date.getDay() === 5
  }

  function coerceInlineModel(value: AdvancedDateModel<Date>) {
    const normalized = normalizeInlineValue(value)

    if (!inlineOptions.value.range) return normalized.start
    if (!normalized.start && !normalized.end) return null

    if (inlineOptions.value.returnObject) {
      return {
        start: normalized.start,
        end: normalized.end,
      }
    }

    return [normalized.start, normalized.end] as const
  }

  const inlineShowPresets = computed(
    () =>
      inlineOptions.value.range && inlineOptions.value.presetMode !== 'hidden',
  )
  const inlinePresets = computed(() =>
    inlineOptions.value.range && inlineOptions.value.presetMode === 'custom'
      ? customPresets
      : undefined,
  )
  const inlineInputProps = computed(() => ({
    inline: true,
    range: inlineOptions.value.range,
    months: inlineOptions.value.months,
    autoApply: inlineOptions.value.autoApply,
    returnObject: inlineOptions.value.returnObject,
    showPresets: inlineShowPresets.value,
    presets: inlinePresets.value,
    showWeekNumbers: inlineOptions.value.showWeekNumbers,
    firstDayOfWeek: inlineOptions.value.firstDayOfWeek,
    density: inlineOptions.value.density,
    disabled: inlineOptions.value.disabled,
    readonly: inlineOptions.value.readonly,
  }))

  watch(
    () =>
      [inlineOptions.value.range, inlineOptions.value.returnObject] as const,
    () => {
      inlineValue.value = coerceInlineModel(inlineValue.value)
    },
  )

  const output = computed(() => ({
    playground: {
      locale: playgroundLocale.value,
      themeMode: themeMode.value,
    },
    inlineOptions: {
      range: inlineOptions.value.range,
      months: inlineOptions.value.months,
      autoApply: inlineOptions.value.autoApply,
      returnObject: inlineOptions.value.returnObject,
      showPresets: inlineShowPresets.value,
      presetMode: inlineOptions.value.range
        ? inlineOptions.value.presetMode
        : 'hidden',
      showWeekNumbers: inlineOptions.value.showWeekNumbers,
      firstDayOfWeek: inlineOptions.value.firstDayOfWeek,
      density: inlineOptions.value.density,
      disabled: inlineOptions.value.disabled,
      readonly: inlineOptions.value.readonly,
    },
    range: serializePreviewModel(rangeValue.value),
    single: serializePreviewModel(singleValue.value),
    inline: serializePreviewModel(inlineValue.value),
    constrained: serializePreviewModel(constrainedValue.value),
    typed: serializePreviewModel(typedValue.value),
    pickerOnly: serializePreviewModel(pickerOnlyValue.value),
    menus: {
      range: rangeMenu.value,
      presets: presetMenu.value,
      customPresets: customPresetMenu.value,
    },
  }))

  return {
    localeOptions,
    themeModeOptions,
    monthOptions,
    presetModeOptions,
    firstDayOfWeekOptions,
    densityOptions,
    playgroundLocale,
    themeMode,
    minDate,
    maxDate,
    rangeValue,
    singleValue,
    inlineValue,
    constrainedValue,
    typedValue,
    pickerOnlyValue,
    rangeMenu,
    presetMenu,
    customPresetMenu,
    inlineOptions,
    inlineInputProps,
    customPresets,
    disableWeekends,
    allowMondays,
    allowFridays,
    output,
  }
}
