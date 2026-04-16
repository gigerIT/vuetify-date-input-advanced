import { computed, nextTick, ref, type Ref } from 'vue'

import type {
  AdvancedDateAdapter,
  AdvancedDateMonthData,
  NormalizedRange,
} from '@/types'
import { dateKey } from '@/util/dates'

import { useRovingFocus } from './useRovingFocus'

export function useAdvancedDatePickerFocus<TDate>(options: {
  adapter: AdvancedDateAdapter<TDate>
  months: Ref<AdvancedDateMonthData<TDate>[]>
  selection: Ref<NormalizedRange<TDate>>
  firstDayOfWeek: Ref<number | string | undefined>
  containerRef: Ref<HTMLElement | null>
  monthsTrackRef: Ref<HTMLElement | null>
  ensureDateVisible: (date: TDate) => Promise<void>
  onSelect: (date: TDate) => void
  onEscape: () => void
}) {
  const dayButtons = ref<HTMLButtonElement[]>([])
  const dayButtonLookup = ref(new Map<string, HTMLButtonElement>())

  const dayLookup = computed(() => {
    return new Map(
      options.months.value.flatMap((month) =>
        month.weeks.flatMap((week) =>
          week.days.map((day) => [day.key, day.date] as const),
        ),
      ),
    )
  })

  const firstAvailableDay = computed(() => {
    return options.months.value
      .flatMap((month) => month.weeks)
      .flatMap((week) => week.days)
      .find((day) => !day.outside && !day.disabled)
  })

  function refreshDayButtons() {
    const buttons = Array.from(
      (
        options.monthsTrackRef.value ?? options.containerRef.value
      )?.querySelectorAll<HTMLButtonElement>('button[data-date]') ?? [],
    )

    dayButtons.value = buttons
    dayButtonLookup.value = new Map(
      buttons.flatMap((button) =>
        button.dataset.date ? [[button.dataset.date, button] as const] : [],
      ),
    )
  }

  function findFocusableButton(
    targetKey: string,
    direction: 1 | -1,
  ): HTMLButtonElement | null {
    const index = dayButtons.value.findIndex(
      (button) => button.dataset.date === targetKey,
    )

    if (index === -1) return null
    if (!dayButtons.value[index].disabled) return dayButtons.value[index]

    for (
      let cursor = index + direction;
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
    const direct = dayButtonLookup.value.get(targetKey) ?? null
    const button = direct?.disabled
      ? findFocusableButton(targetKey, direction)
      : direct

    button?.focus()

    const resolved = button?.dataset.date
      ? dayLookup.value.get(button.dataset.date) ?? null
      : null
    if (resolved) focus.setActiveDate(resolved)
  }

  function focusActiveDate() {
    const fallback =
      focus.activeDate.value ??
      options.selection.value.start ??
      firstAvailableDay.value?.date

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
    const preferredKey = focus.activeDate.value
      ? dateKey(options.adapter, focus.activeDate.value)
      : options.selection.value.start
        ? dateKey(options.adapter, options.selection.value.start)
        : ''

    if (preferredKey) {
      const preferredDay = options.months.value
        .flatMap((month) => month.weeks)
        .flatMap((week) => week.days)
        .find(
          (day) => day.key === preferredKey && !day.outside && !day.disabled,
        )

      if (preferredDay) return preferredDay.key
    }

    return firstAvailableDay.value?.key ?? ''
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
