import { computed, nextTick, ref, type Ref } from 'vue'

import type {
  AdvancedDateAdapter,
  AdvancedDateInputField,
  AdvancedDateMonthData,
  NormalizedRange,
} from '@/types'
import { dateKey } from '@/util/dates'

import { useRovingFocus } from './useRovingFocus'

export function useAdvancedDatePickerFocus<TDate>(options: {
  adapter: AdvancedDateAdapter<TDate>
  months: Ref<AdvancedDateMonthData<TDate>[]>
  selection: Ref<NormalizedRange<TDate>>
  selectionTargetField: Ref<AdvancedDateInputField | null>
  firstDayOfWeek: Ref<number | string | undefined>
  containerRef: Ref<HTMLElement | null>
  monthsTrackRef: Ref<HTMLElement | null>
  ensureDateVisible: (date: TDate) => Promise<void>
  onSelect: (date: TDate) => void
  onEscape: () => void
}) {
  const dayButtons = ref<HTMLButtonElement[]>([])
  const dayButtonLookup = ref(
    new Map<string, { button: HTMLButtonElement; index: number }>(),
  )

  const dayIndex = computed(() => {
    const dateByKey = new Map<string, TDate>()
    const focusableKeys = new Set<string>()
    let firstFocusableDay: { key: string; date: TDate } | null = null

    for (const month of options.months.value) {
      for (const week of month.weeks) {
        for (const day of week.days) {
          if (day.outside) continue

          dateByKey.set(day.key, day.date)
          if (day.disabled) continue

          focusableKeys.add(day.key)
          firstFocusableDay ??= { key: day.key, date: day.date }
        }
      }
    }

    return {
      dateByKey,
      focusableKeys,
      firstFocusableDay,
    }
  })

  function refreshDayButtons() {
    const buttons = Array.from(
      (
        options.monthsTrackRef.value ?? options.containerRef.value
      )?.querySelectorAll<HTMLButtonElement>('button[data-date]') ?? [],
    )

    dayButtons.value = buttons
    dayButtonLookup.value = new Map(
      buttons.flatMap((button, index) =>
        button.dataset.date
          ? [[button.dataset.date, { button, index }] as const]
          : [],
      ),
    )
  }

  function findFocusableButton(
    targetKey: string,
    direction: 1 | -1,
  ): HTMLButtonElement | null {
    const target = dayButtonLookup.value.get(targetKey)

    if (!target) return null
    if (!target.button.disabled) return target.button

    for (
      let cursor = target.index + direction;
      dayButtons.value[cursor];
      cursor += direction
    ) {
      if (!dayButtons.value[cursor].disabled) return dayButtons.value[cursor]
    }

    return null
  }

  async function focusDate(date: TDate) {
    await options.ensureDateVisible(date)
    await nextTick()
    refreshDayButtons()

    const targetKey = dateKey(options.adapter, date)
    const referenceDate =
      focus.activeDate.value ?? options.selection.value.start ?? date
    const direction = options.adapter.isBefore(date, referenceDate) ? -1 : 1
    const direct = dayButtonLookup.value.get(targetKey)?.button ?? null
    const button = direct?.disabled
      ? findFocusableButton(targetKey, direction)
      : direct

    button?.focus()

    const resolved = button?.dataset.date
      ? dayIndex.value.dateByKey.get(button.dataset.date) ?? null
      : null
    if (resolved) focus.setActiveDate(resolved)
  }

  function selectionFocusDate() {
    if (
      options.selectionTargetField.value === 'end' &&
      options.selection.value.end
    ) {
      return options.selection.value.end
    }

    return options.selection.value.start
  }

  function focusActiveDate() {
    const fallback =
      selectionFocusDate() ??
      focus.activeDate.value ??
      dayIndex.value.firstFocusableDay?.date

    if (!fallback) return

    void focusDate(fallback)
  }

  const focus = useRovingFocus({
    adapter: options.adapter,
    firstDayOfWeek: options.firstDayOfWeek,
    onFocusDate: focusDate,
    onSelect: options.onSelect,
    onEscape: options.onEscape,
  })

  const activeDateKey = computed(() => {
    const selectedDate = selectionFocusDate()
    const preferredKey = focus.activeDate.value
      ? dateKey(options.adapter, focus.activeDate.value)
      : selectedDate
        ? dateKey(options.adapter, selectedDate)
        : ''

    if (preferredKey) {
      if (dayIndex.value.focusableKeys.has(preferredKey)) return preferredKey
    }

    return dayIndex.value.firstFocusableDay?.key ?? ''
  })

  return {
    activeDateKey,
    focusDate,
    focusActiveDate,
    refreshDayButtons,
    setActiveDate: focus.setActiveDate,
    onKeydown: focus.onKeydown,
  }
}
