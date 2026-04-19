import { computed, type Ref } from 'vue'

import { useDateInputAdvancedLocale } from '@/composables/useDateInputAdvancedLocale'
import type { AdvancedDateAdapter, NormalizedRange } from '@/types'

export function useAdvancedDatePickerLiveText<TDate>(options: {
  adapter: AdvancedDateAdapter<TDate>
  range: Ref<boolean>
  isMobileScroll: Ref<boolean>
  displayedMonth: Ref<TDate>
  months: Ref<Array<{ label: string }>>
  selection: Ref<NormalizedRange<TDate>>
}) {
  const { tDateInputAdvanced } = useDateInputAdvancedLocale()

  return computed(() => {
    const labels = options.isMobileScroll.value
      ? options.adapter.format(options.displayedMonth.value, 'monthAndYear')
      : options.months.value.map((month) => month.label).join(', ')

    if (
      options.range.value &&
      options.selection.value.start &&
      options.selection.value.end
    ) {
      return tDateInputAdvanced(
        'live.selectedRange',
        options.adapter.format(options.selection.value.start, 'fullDate'),
        options.adapter.format(options.selection.value.end, 'fullDate'),
        labels,
      )
    }

    if (!options.range.value && options.selection.value.start) {
      return tDateInputAdvanced(
        'live.selectedDate',
        options.adapter.format(options.selection.value.start, 'fullDate'),
        labels,
      )
    }

    return labels
  })
}
