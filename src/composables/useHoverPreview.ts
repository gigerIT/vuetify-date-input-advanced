import { computed, ref, type Ref } from 'vue'
import { useDate } from 'vuetify'
import { getRangeEdges } from '@/utils/dateHelpers'

export function useHoverPreview(
  modelValue: Ref<unknown | unknown[] | null>,
  range: Ref<boolean>,
) {
  const adapter = useDate()
  const hoveredDate = ref<unknown | null>(null)

  const previewRange = computed<[unknown, unknown] | null>(() => {
    if (!range.value || !hoveredDate.value) return null

    const edges = getRangeEdges(modelValue.value)
    if (!edges.start || edges.end) return null

    if (adapter.isAfter(edges.start, hoveredDate.value)) {
      return [hoveredDate.value, edges.start]
    }

    return [edges.start, hoveredDate.value]
  })

  const isPreviewDate = (date: unknown): boolean => {
    if (!previewRange.value) return false
    return adapter.isWithinRange(date, previewRange.value)
  }

  const isPreviewStart = (date: unknown): boolean => {
    if (!previewRange.value) return false
    return adapter.isSameDay(date, previewRange.value[0])
  }

  const isPreviewEnd = (date: unknown): boolean => {
    if (!previewRange.value) return false
    return adapter.isSameDay(date, previewRange.value[1])
  }

  return {
    hoveredDate,
    previewRange,
    setHoveredDate: (date: unknown | null) => {
      hoveredDate.value = date
    },
    clearHoveredDate: () => {
      hoveredDate.value = null
    },
    isPreviewDate,
    isPreviewStart,
    isPreviewEnd,
  }
}
