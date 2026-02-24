import { computed, type Ref } from 'vue'
import type { ResolvedPresetRange, PresetRange } from '@/types'
import { compareRange } from '@/utils/dateHelpers'

type DateAdapter = ReturnType<typeof import('vuetify').useDate>

function buildDefaultPresets(adapter: DateAdapter): ResolvedPresetRange[] {
  const today = adapter.startOfDay(adapter.date())
  const yesterday = adapter.addDays(today, -1)

  const thisMonthStart = adapter.startOfMonth(today)
  const thisMonthEnd = adapter.endOfMonth(today)
  const lastMonthStart = adapter.startOfMonth(adapter.addMonths(today, -1))
  const lastMonthEnd = adapter.endOfMonth(lastMonthStart)

  const currentQuarterStartMonth = Math.floor(adapter.getMonth(today) / 3) * 3
  const thisQuarterStart = adapter.setMonth(adapter.startOfYear(today), currentQuarterStartMonth)
  const thisQuarterEnd = adapter.endOfMonth(adapter.addMonths(thisQuarterStart, 2))

  const lastQuarterStart = adapter.addMonths(thisQuarterStart, -3)
  const lastQuarterEnd = adapter.endOfMonth(adapter.addMonths(lastQuarterStart, 2))

  const thisYearStart = adapter.startOfYear(today)
  const lastYearStart = adapter.addMonths(thisYearStart, -12)
  const lastYearEnd = adapter.endOfYear(lastYearStart)

  return [
    { label: 'Today', value: [today, today] },
    { label: 'Yesterday', value: [yesterday, yesterday] },
    { label: 'Last 7 Days', value: [adapter.addDays(today, -6), today] },
    { label: 'Last 30 Days', value: [adapter.addDays(today, -29), today] },
    { label: 'This Month', value: [thisMonthStart, thisMonthEnd] },
    { label: 'Last Month', value: [lastMonthStart, lastMonthEnd] },
    { label: 'This Quarter', value: [thisQuarterStart, thisQuarterEnd] },
    { label: 'Last Quarter', value: [lastQuarterStart, lastQuarterEnd] },
    { label: 'Year to Date', value: [thisYearStart, today] },
    { label: 'Last Year', value: [lastYearStart, lastYearEnd] },
  ]
}

function resolvePreset(preset: PresetRange): ResolvedPresetRange {
  const value = typeof preset.value === 'function' ? preset.value() : preset.value
  return {
    label: preset.label,
    slot: preset.slot,
    value,
  }
}

export function usePresets(
  adapter: DateAdapter,
  presets: Ref<PresetRange[] | undefined>,
  modelValue: Ref<unknown | unknown[] | null>,
) {
  const resolvedPresets = computed<ResolvedPresetRange[]>(() => {
    if (!presets.value?.length) return buildDefaultPresets(adapter)
    return presets.value.map(resolvePreset)
  })

  const activePresetIndex = computed(() => {
    return resolvedPresets.value.findIndex((preset) => compareRange(adapter, modelValue.value, preset.value))
  })

  return {
    resolvedPresets,
    activePresetIndex,
  }
}
