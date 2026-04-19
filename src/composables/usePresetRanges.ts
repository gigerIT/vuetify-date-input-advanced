import { computed, type Ref } from 'vue'

import { useDateInputAdvancedLocale } from '@/composables/useDateInputAdvancedLocale'
import type { AdvancedDateAdapter, NormalizedRange, PresetRange } from '@/types'
import { isSameDay } from '@/util/dates'
import { orderRange } from '@/util/model'
import { createDefaultPresets } from '@/util/presets'

export function usePresetRanges<TDate>(options: {
  adapter: AdvancedDateAdapter<TDate>
  presets: Ref<PresetRange<TDate>[] | undefined>
  range: Ref<boolean>
  selection: Ref<NormalizedRange<TDate>>
  isDisabled?: (range: NormalizedRange<TDate>) => boolean
}) {
  const { tDateInputAdvanced } = useDateInputAdvancedLocale()

  const presets = computed(() => {
    if (!options.range.value) return []
    return (
      options.presets.value ??
      createDefaultPresets(options.adapter, {
        today: tDateInputAdvanced('presets.today'),
        yesterday: tDateInputAdvanced('presets.yesterday'),
        last7Days: tDateInputAdvanced('presets.last7Days'),
        last30Days: tDateInputAdvanced('presets.last30Days'),
        thisMonth: tDateInputAdvanced('presets.thisMonth'),
        lastMonth: tDateInputAdvanced('presets.lastMonth'),
        thisQuarter: tDateInputAdvanced('presets.thisQuarter'),
        lastQuarter: tDateInputAdvanced('presets.lastQuarter'),
        yearToDate: tDateInputAdvanced('presets.yearToDate'),
        lastYear: tDateInputAdvanced('presets.lastYear'),
      })
    )
  })

  function resolvePreset(preset: PresetRange<TDate>): [TDate, TDate] {
    return typeof preset.value === 'function' ? preset.value() : preset.value
  }

  function normalizePreset(preset: PresetRange<TDate>): NormalizedRange<TDate> {
    const [start, end] = resolvePreset(preset)
    return orderRange(options.adapter, { start, end }) as NormalizedRange<TDate>
  }

  function isPresetActive(preset: PresetRange<TDate>): boolean {
    const { start, end } = normalizePreset(preset)
    return (
      isSameDay(options.adapter, options.selection.value.start, start) &&
      isSameDay(options.adapter, options.selection.value.end, end)
    )
  }

  function isPresetDisabled(preset: PresetRange<TDate>): boolean {
    return options.isDisabled?.(normalizePreset(preset)) ?? false
  }

  return {
    presets,
    resolvePreset,
    isPresetActive,
    isPresetDisabled,
  }
}
