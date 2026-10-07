import { computed, nextTick, onBeforeUnmount, ref, watch, type Ref } from 'vue'

import type { AdvancedDateAdapter, NormalizedRange } from '@/types'
import { dateKey } from '@/util/dates'
import {
  MONTH_SEARCH_BATCH,
  type MonthAvailability,
} from './useAdvancedDateMonthAvailability'

const MOBILE_INITIAL_PREVIOUS_MONTHS = 1
const MOBILE_INITIAL_NEXT_MONTHS = 5
const MOBILE_LOAD_MONTH_STEP = 3
const MOBILE_MAX_RENDERED_MONTHS = 10

export function useAdvancedDatePickerMobileWindow<TDate>(options: {
  adapter: AdvancedDateAdapter<TDate>
  availability: MonthAvailability<TDate>
  desktopVisibleMonths: Ref<TDate[]>
  displayedMonth: Ref<TDate>
  setDisplayedMonth: (month: TDate) => void
  selectionChangeOrigin: Ref<'external' | 'internal'>
  isMobileScroll: Ref<boolean>
  isMobileFullscreen: Ref<boolean>
  months: Ref<number>
  selection: Ref<NormalizedRange<TDate>>
}) {
  const containerRef = ref<HTMLElement | null>(null)
  const monthsTrackRef = ref<HTMLElement | null>(null)
  const mobileWindowStart = ref<TDate | null>(null)
  const mobileWindowCount = ref(0)
  const forwardSpan = ref(MONTH_SEARCH_BATCH)
  const backwardSpan = ref(MONTH_SEARCH_BATCH)
  const mobileInlineHeight = ref<number | null>(null)
  const mobileMutating = ref(false)
  const pendingMobileScrollMonthKey = ref('')
  let scrollFrame = 0

  const mobileWindowBaseCount = computed(() =>
    Math.max(options.months.value + MOBILE_INITIAL_NEXT_MONTHS, 7),
  )

  const window = computed(() =>
    mobileWindowStart.value
      ? options.availability.collect(
          mobileWindowStart.value,
          mobileWindowCount.value,
          forwardSpan.value,
          [options.displayedMonth.value],
        )
      : { months: [], next: { kind: 'boundary' as const } },
  )
  const mobileVisibleMonths = computed<TDate[]>((previous) => {
    const months = window.value.months
    return previous?.length === months.length &&
      months.every((month, index) =>
        options.adapter.isSameMonth(month, previous[index]),
      )
      ? previous
      : months
  })
  const previous = computed(() =>
    mobileWindowStart.value
      ? options.availability.find(
          mobileWindowStart.value,
          -1,
          backwardSpan.value,
        )
      : { kind: 'boundary' as const },
  )
  const next = computed(() => window.value.next)

  function resetWindow(anchor: TDate) {
    const targetMonth = options.adapter.startOfMonth(anchor)
    forwardSpan.value = MONTH_SEARCH_BATCH
    backwardSpan.value = MONTH_SEARCH_BATCH
    let start = targetMonth
    for (let index = 0; index < MOBILE_INITIAL_PREVIOUS_MONTHS; index++) {
      const result = options.availability.find(start, -1)
      if (result.kind !== 'found') break
      start = result.month
    }
    mobileWindowStart.value = start
    mobileWindowCount.value = Math.min(
      mobileWindowBaseCount.value,
      MOBILE_MAX_RENDERED_MONTHS,
    )
    pendingMobileScrollMonthKey.value = dateKey(options.adapter, targetMonth)
  }

  const visibleMonths = computed(() =>
    options.isMobileScroll.value
      ? mobileVisibleMonths.value
      : options.desktopVisibleMonths.value,
  )

  const monthsTrackKey = computed(() =>
    visibleMonths.value
      .map((month) => dateKey(options.adapter, month))
      .join(':'),
  )

  const monthsStyle = computed(() => {
    const style: Record<string, string> = {
      touchAction: 'pan-y',
    }

    if (
      options.isMobileScroll.value &&
      !options.isMobileFullscreen.value &&
      mobileInlineHeight.value
    ) {
      style.blockSize = `${mobileInlineHeight.value}px`
    }

    return style
  })

  function setMonthsTrackRef(element: unknown) {
    if (element instanceof HTMLElement) {
      monthsTrackRef.value = element
      return
    }

    monthsTrackRef.value = null
  }

  function getMonthElements() {
    return Array.from(
      monthsTrackRef.value?.querySelectorAll<HTMLElement>(
        '.v-advanced-date-picker__month',
      ) ?? [],
    )
  }

  function findMonthElement(key: string) {
    return (
      getMonthElements().find((element) => element.dataset.month === key) ??
      null
    )
  }

  function getLeadingVisibleMonthElement() {
    const container = containerRef.value
    if (!container) return null

    return (
      getMonthElements().find(
        (element) =>
          element.offsetTop + element.offsetHeight > container.scrollTop + 1,
      ) ??
      getMonthElements()[0] ??
      null
    )
  }

  function measureMobileInlineHeight() {
    if (!options.isMobileScroll.value || options.isMobileFullscreen.value) {
      mobileInlineHeight.value = null
      return
    }

    const months = getMonthElements().slice(0, options.months.value)
    if (!months.length) return

    // Measure calendar offsets, which include gap indicators between months.
    const first = months[0]
    const last = months.at(-1)!
    const padding = containerRef.value
      ? getComputedStyle(containerRef.value)
      : null
    mobileInlineHeight.value =
      last.offsetTop +
      last.offsetHeight -
      first.offsetTop +
      (Number.parseFloat(padding?.paddingTop || '0') || 0) +
      (Number.parseFloat(padding?.paddingBottom || '0') || 0)
  }

  function captureMonthScrollReference() {
    const container = containerRef.value
    const month = getLeadingVisibleMonthElement()
    if (!container || !month?.dataset.month) return null

    return {
      key: month.dataset.month,
      offset: month.offsetTop - container.scrollTop,
    }
  }

  function restoreMonthScrollReference(
    reference: { key: string; offset: number } | null,
  ) {
    const container = containerRef.value
    if (!container || !reference) return

    const month = findMonthElement(reference.key)
    if (!month) return

    container.scrollTop = Math.max(month.offsetTop - reference.offset, 0)
  }

  function scrollMonthIntoView(month: TDate) {
    const container = containerRef.value
    const element = findMonthElement(dateKey(options.adapter, month))
    if (!container || !element) return

    container.scrollTop = element.offsetTop
  }

  function syncDisplayedMonthFromScroll() {
    if (!options.isMobileScroll.value) return

    const key = getLeadingVisibleMonthElement()?.dataset.month
    if (!key) return

    const month = visibleMonths.value.find(
      (entry) => dateKey(options.adapter, entry) === key,
    )
    if (month) options.setDisplayedMonth(month)
  }

  async function prependMobileMonths(continueSearch = false) {
    if (
      !options.isMobileScroll.value ||
      mobileMutating.value ||
      !mobileWindowStart.value
    )
      return
    if (continueSearch && previous.value.kind === 'pending')
      backwardSpan.value += MONTH_SEARCH_BATCH
    const added: TDate[] = []
    let first = mobileWindowStart.value
    for (let index = 0; index < MOBILE_LOAD_MONTH_STEP; index++) {
      const result = options.availability.find(first, -1, backwardSpan.value)
      if (result.kind !== 'found') break
      added.unshift(result.month)
      first = result.month
    }
    if (!added.length) return
    const reference = captureMonthScrollReference()
    mobileMutating.value = true
    // Keep the already rendered far edge reachable after prepending across a gap.
    forwardSpan.value = Math.max(forwardSpan.value, backwardSpan.value)
    mobileWindowCount.value = Math.min(
      mobileVisibleMonths.value.length + added.length,
      MOBILE_MAX_RENDERED_MONTHS,
    )
    mobileWindowStart.value = first
    await nextTick()
    restoreMonthScrollReference(reference)
    mobileMutating.value = false
  }

  async function appendMobileMonths(continueSearch = false) {
    if (
      !options.isMobileScroll.value ||
      mobileMutating.value ||
      !mobileWindowStart.value
    )
      return
    const reference = captureMonthScrollReference()
    mobileMutating.value = true
    if (continueSearch && next.value.kind === 'pending')
      forwardSpan.value += MONTH_SEARCH_BATCH
    const expanded = options.availability.collect(
      mobileWindowStart.value,
      mobileVisibleMonths.value.length + MOBILE_LOAD_MONTH_STEP,
      forwardSpan.value,
      [options.displayedMonth.value],
    ).months
    const retained = expanded.slice(-MOBILE_MAX_RENDERED_MONTHS)
    mobileWindowCount.value = retained.length
    mobileWindowStart.value = retained[0]
    await nextTick()
    restoreMonthScrollReference(reference)
    mobileMutating.value = false
  }

  function onMonthsScroll() {
    if (!options.isMobileScroll.value || scrollFrame) return

    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0

      const container = containerRef.value
      if (!container) return

      syncDisplayedMonthFromScroll()

      const threshold = Math.max(container.clientHeight * 0.5, 120)
      const distanceToBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight

      if (container.scrollTop <= threshold) {
        void prependMobileMonths()
      }

      if (distanceToBottom <= threshold) {
        void appendMobileMonths()
      }
    })
  }

  function handleMonthsRendered() {
    measureMobileInlineHeight()

    if (!pendingMobileScrollMonthKey.value) return

    const month = visibleMonths.value.find(
      (entry) =>
        dateKey(options.adapter, entry) === pendingMobileScrollMonthKey.value,
    )

    if (month) scrollMonthIntoView(month)
    pendingMobileScrollMonthKey.value = ''
  }

  watch(
    [options.isMobileScroll, options.displayedMonth],
    ([mobile, displayedMonth]) => {
      if (!mobile) {
        mobileWindowStart.value = null
        mobileWindowCount.value = 0
        mobileInlineHeight.value = null
        return
      }

      const visible = mobileVisibleMonths.value.some((month) =>
        options.adapter.isSameMonth(month, displayedMonth),
      )

      if (!visible) resetWindow(displayedMonth)
    },
    { immediate: true },
  )

  watch(
    [() => options.selection.value.start, () => options.selection.value.end],
    () => {
      if (!options.isMobileScroll.value) return
      const anchorMonth =
        options.selection.value.start ?? options.displayedMonth.value

      // The computed window tracks availability. Internal picks retain the
      // current scroll anchor while filtering and refilling surrounding months.
      if (options.selectionChangeOrigin.value === 'internal') return

      resetWindow(anchorMonth)
    },
  )

  watch(options.availability.constraints, () => {
    if (!options.isMobileScroll.value) return

    resetWindow(options.displayedMonth.value)
  })

  watch(mobileVisibleMonths, () => {
    if (!options.isMobileScroll.value || mobileMutating.value) return
    const reference = captureMonthScrollReference()
    void nextTick(() => restoreMonthScrollReference(reference))
  })

  onBeforeUnmount(() => {
    if (!scrollFrame) return
    cancelAnimationFrame(scrollFrame)
  })

  return {
    containerRef,
    monthsTrackRef,
    setMonthsTrackRef,
    visibleMonths,
    previous,
    next,
    prependMobileMonths,
    appendMobileMonths,
    monthsTrackKey,
    monthsStyle,
    onMonthsScroll,
    resetWindow,
    scrollMonthIntoView,
    handleMonthsRendered,
  }
}
