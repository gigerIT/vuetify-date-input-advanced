import { computed, type Ref } from 'vue'
import type { PresetRange } from '../types'
import { isSameDay } from '../utils/dateHelpers'

function getDefaultPresets(): PresetRange[] {
  return [
    {
      label: 'Today',
      value: () => {
        return [new Date(), new Date()]
      },
    },
    {
      label: 'Yesterday',
      value: () => {
        const a = new Date()
        a.setDate(a.getDate() - 1)
        const b = new Date()
        b.setDate(b.getDate() - 1)
        return [a, b]
      },
    },
    {
      label: 'Last 7 Days',
      value: () => {
        const end = new Date()
        const start = new Date()
        start.setDate(start.getDate() - 6)
        return [start, end]
      },
    },
    {
      label: 'Last 30 Days',
      value: () => {
        const end = new Date()
        const start = new Date()
        start.setDate(start.getDate() - 29)
        return [start, end]
      },
    },
    {
      label: 'This Month',
      value: () => {
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth(), 1)
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        return [start, end]
      },
    },
    {
      label: 'Last Month',
      value: () => {
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const end = new Date(now.getFullYear(), now.getMonth(), 0)
        return [start, end]
      },
    },
    {
      label: 'This Quarter',
      value: () => {
        const now = new Date()
        const q = Math.floor(now.getMonth() / 3)
        const start = new Date(now.getFullYear(), q * 3, 1)
        const end = new Date(now.getFullYear(), q * 3 + 3, 0)
        return [start, end]
      },
    },
    {
      label: 'Last Quarter',
      value: () => {
        const now = new Date()
        const q = Math.floor(now.getMonth() / 3) - 1
        const year = q < 0 ? now.getFullYear() - 1 : now.getFullYear()
        const quarter = q < 0 ? 3 : q
        const start = new Date(year, quarter * 3, 1)
        const end = new Date(year, quarter * 3 + 3, 0)
        return [start, end]
      },
    },
    {
      label: 'Year to Date',
      value: () => {
        const now = new Date()
        const start = new Date(now.getFullYear(), 0, 1)
        return [start, now]
      },
    },
    {
      label: 'Last Year',
      value: () => {
        const now = new Date()
        const start = new Date(now.getFullYear() - 1, 0, 1)
        const end = new Date(now.getFullYear() - 1, 11, 31)
        return [start, end]
      },
    },
  ]
}

export interface UsePresetsOptions {
  presets: Ref<PresetRange[] | undefined>
  startDate: Ref<Date | null>
  endDate: Ref<Date | null>
}

export function usePresets(options: UsePresetsOptions) {
  const { presets, startDate, endDate } = options

  const effectivePresets = computed<PresetRange[]>(() => {
    return presets.value ?? getDefaultPresets()
  })

  /** Resolve a preset's value to a concrete [Date, Date] */
  function resolvePreset(preset: PresetRange): [Date, Date] {
    return typeof preset.value === 'function' ? preset.value() : preset.value
  }

  /** Check if a preset matches the current selection */
  function isPresetActive(preset: PresetRange): boolean {
    if (!startDate.value || !endDate.value) return false
    const [ps, pe] = resolvePreset(preset)
    return isSameDay(startDate.value, ps) && isSameDay(endDate.value, pe)
  }

  /** Get the index of the currently active preset, or -1 */
  const activePresetIndex = computed(() => {
    return effectivePresets.value.findIndex(isPresetActive)
  })

  return {
    effectivePresets,
    activePresetIndex,
    resolvePreset,
    isPresetActive,
  }
}
