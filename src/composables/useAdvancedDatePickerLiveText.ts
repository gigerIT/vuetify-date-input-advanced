import { computed, type Ref } from 'vue'

import type { AdvancedDateAdapter, NormalizedRange } from '@/types'

export function useAdvancedDatePickerLiveText<TDate>(options: {
  adapter: AdvancedDateAdapter<TDate>
  range: Ref<boolean>
  isMobileScroll: Ref<boolean>
  displayedMonth: Ref<TDate>
  months: Ref<Array<{ label: string }>>
  selection: Ref<NormalizedRange<TDate>>
}) {
  return computed(() => {
    const labels = options.isMobileScroll.value
      ? options.adapter.format(options.displayedMonth.value, 'monthAndYear')
      : options.months.value.map((month) => month.label).join(', ')

    if (
      options.range.value &&
      options.selection.value.start &&
      options.selection.value.end
    ) {
      return `Selected range ${options.adapter.format(options.selection.value.start, 'fullDate')} to ${options.adapter.format(options.selection.value.end, 'fullDate')}. ${labels}`
    }

    if (!options.range.value && options.selection.value.start) {
      return `Selected date ${options.adapter.format(options.selection.value.start, 'fullDate')}. ${labels}`
    }

    return labels
  })
}
