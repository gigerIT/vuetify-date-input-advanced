import { computed, type Ref } from 'vue'

import type { AdvancedDateAdapter, NormalizedRange, PresetRange } from '@/types'
import { isSameDay } from '@/util/dates'
import { createDefaultPresets } from '@/util/presets'

export function usePresetRanges<TDate>(options: {
  adapter: AdvancedDateAdapter<TDate>
  presets: Ref<PresetRange<TDate>[] | undefined>
  range: Ref<boolean>
  selection: Ref<NormalizedRange<TDate>>
}) {
  const presets = computed(() => {
    if (!options.range.value) return []
    return options.presets.value ?? createDefaultPresets(options.adapter)
  })

  function resolvePreset(preset: PresetRange<TDate>): [TDate, TDate] {
    return typeof preset.value === 'function' ? preset.value() : preset.value
  }

  function isPresetActive(preset: PresetRange<TDate>): boolean {
    const [start, end] = resolvePreset(preset)
    return (
      isSameDay(options.adapter, options.selection.value.start, start)
      && isSameDay(options.adapter, options.selection.value.end, end)
    )
  }

  return {
    presets,
    resolvePreset,
    isPresetActive,
  }
}
