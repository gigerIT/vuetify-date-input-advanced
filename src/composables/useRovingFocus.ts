import { ref } from 'vue'

import type { AdvancedDateAdapter } from '@/types'
import { getWeekdayIndex } from '@/util/week'

export function useRovingFocus<TDate>(options: {
  adapter: AdvancedDateAdapter<TDate>
  onFocusDate?: (date: TDate) => void
  onSelect?: (date: TDate) => void
  onEscape?: () => void
}) {
  const activeDate = ref<TDate | null>(null)

  function setActiveDate(date: TDate | null) {
    activeDate.value = date
  }

  function onKeydown(event: KeyboardEvent, date: TDate) {
    let next: TDate | null = null

    switch (event.key) {
      case 'ArrowLeft':
        next = options.adapter.addDays(date, -1)
        break
      case 'ArrowRight':
        next = options.adapter.addDays(date, 1)
        break
      case 'ArrowUp':
        next = options.adapter.addDays(date, -7)
        break
      case 'ArrowDown':
        next = options.adapter.addDays(date, 7)
        break
      case 'Home':
        next = options.adapter.addDays(date, -getWeekdayIndex(options.adapter, date))
        break
      case 'End':
        next = options.adapter.addDays(date, 6 - getWeekdayIndex(options.adapter, date))
        break
      case 'PageUp':
        next = event.shiftKey
          ? options.adapter.setYear(date, options.adapter.getYear(date) - 1)
          : options.adapter.addMonths(date, -1)
        break
      case 'PageDown':
        next = event.shiftKey
          ? options.adapter.setYear(date, options.adapter.getYear(date) + 1)
          : options.adapter.addMonths(date, 1)
        break
      case 'Enter':
      case ' ':
      case 'Spacebar':
        event.preventDefault()
        options.onSelect?.(date)
        return
      case 'Escape':
        event.preventDefault()
        options.onEscape?.()
        return
      default:
        return
    }

    if (!next) return

    event.preventDefault()
    activeDate.value = next
    options.onFocusDate?.(next)
  }

  return {
    activeDate,
    setActiveDate,
    onKeydown,
  }
}
