import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  shallowRef,
  watch,
  type Ref,
} from 'vue'

import type {
  AdvancedDateAdapter,
  AdvancedDateInputField,
  DateBounds,
  NormalizedRange,
} from '@/types'
import { dateKey, monthHasSelectableDate } from '@/util/dates'

const MOBILE_INITIAL_PREVIOUS_MONTHS = 1
const MOBILE_INITIAL_NEXT_MONTHS = 5
const MOBILE_LOAD_MONTH_STEP = 3
const MOBILE_MAX_RENDERED_MONTHS = 10

export function useAdvancedDatePickerMobileWindow<TDate>(options: {
  adapter: AdvancedDateAdapter<TDate>
  desktopVisibleMonths: Ref<TDate[]>
  displayedMonth: Ref<TDate>
  setDisplayedMonth: (month: TDate) => void
  selectionChangeOrigin: Ref<'external' | 'internal'>
  isMobileScroll: Ref<boolean>
  isMobileFullscreen: Ref<boolean>
  months: Ref<number>
  selection: Ref<NormalizedRange<TDate>>
  selectionTargetField: Ref<AdvancedDateInputField | null>
  range: Ref<boolean>
  min: Ref<TDate | null | undefined>
  max: Ref<TDate | null | undefined>
  allowedDates: Ref<((date: TDate) => boolean) | undefined>
  allowedStartDates: Ref<((date: TDate) => boolean) | undefined>
  allowedEndDates: Ref<((date: TDate) => boolean) | undefined>
}) {
  const containerRef = ref<HTMLElement | null>(null)
  const monthsTrackRef = ref<HTMLElement | null>(null)
  const mobileWindowStart = ref<TDate | null>(null)
  const mobileWindowCount = ref(0)
  const mobileVisibleMonths = shallowRef<TDate[]>([])
  const mobileInlineHeight = ref<number | null>(null)
  const mobileMutating = ref(false)
  const pendingMobileScrollMonthKey = ref('')
  let scrollFrame = 0

  const mobileWindowBaseCount = computed(() =>
    Math.max(options.months.value + MOBILE_INITIAL_NEXT_MONTHS, 7),
  )

  const constraints = computed<DateBounds<TDate>>(() => ({
    min: options.min.value,
    max: options.max.value,
    allowedDates: options.allowedDates.value,
    allowedStartDates: options.allowedStartDates.value,
    allowedEndDates: options.allowedEndDates.value,
  }))

  function canRenderMonth(month: TDate) {
    return monthHasSelectableDate(
      options.adapter,
      month,
      options.selection.value,
      options.range.value,
      constraints.value,
      options.selectionTargetField.value,
    )
  }

  function buildMobileMonthWindow(
    start: TDate,
    count: number,
    keepThroughMonth = options.displayedMonth.value,
  ): TDate[] {
    const months: TDate[] = []
    const anchor = options.adapter.startOfMonth(keepThroughMonth)

    for (let index = 0; index < count; index += 1) {
      const month = options.adapter.startOfMonth(
        options.adapter.addMonths(start, index),
      )

      if (!months.length) {
        months.push(month)
        continue
      }

      if (
        options.adapter.isBefore(month, anchor) ||
        options.adapter.isSameMonth(month, anchor)
      ) {
        months.push(month)
        continue
      }

      if (!canRenderMonth(month)) {
        break
      }

      months.push(month)
    }

    return months
  }

  function createWindowStart(anchor: TDate) {
    let start = options.adapter.startOfMonth(anchor)

    for (let index = 0; index < MOBILE_INITIAL_PREVIOUS_MONTHS; index += 1) {
      const previous = options.adapter.startOfMonth(
        options.adapter.addMonths(start, -1),
      )

      if (!canRenderMonth(previous)) break

      start = previous
    }

    return start
  }

  function syncMobileVisibleMonths(keepThroughMonth = options.displayedMonth.value) {
    if (!mobileWindowStart.value) {
      mobileVisibleMonths.value = []
      return
    }

    mobileVisibleMonths.value = buildMobileMonthWindow(
      mobileWindowStart.value,
      mobileWindowCount.value,
      keepThroughMonth,
    )
  }

  function latestPreservedMonth() {
    let preservedMonth = options.adapter.startOfMonth(options.displayedMonth.value)

    for (const date of [
      options.selection.value.start,
      options.selection.value.end,
    ]) {
      if (!date) continue

      const candidate = options.adapter.startOfMonth(date)

      if (options.adapter.isAfter(candidate, preservedMonth)) {
        preservedMonth = candidate
      }
    }

    return preservedMonth
  }

  function resetWindow(anchor: TDate) {
    const targetMonth = options.adapter.startOfMonth(anchor)

    mobileWindowStart.value = createWindowStart(targetMonth)
    mobileWindowCount.value = mobileWindowBaseCount.value
    syncMobileVisibleMonths()
    pendingMobileScrollMonthKey.value = dateKey(options.adapter, targetMonth)
  }

  function rebuildWindowFromAvailabilityChange(anchor: TDate) {
    if (!mobileWindowStart.value || !mobileWindowCount.value) {
      resetWindow(anchor)
      return
    }

    // Rebuild cached months without recentering when only availability inputs
    // change, so the current mobile anchor stays stable when possible.
    syncMobileVisibleMonths(latestPreservedMonth())

    const displayedMonthStillVisible = mobileVisibleMonths.value.some((month) =>
      options.adapter.isSameMonth(month, options.displayedMonth.value),
    )

    if (!mobileVisibleMonths.value.length || !displayedMonthStillVisible) {
      resetWindow(anchor)
    }
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
      getMonthElements().find((element) => element.dataset.month === key) ?? null
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

    const trackStyles = monthsTrackRef.value
      ? getComputedStyle(monthsTrackRef.value)
      : null
    const gap =
      Number.parseFloat(trackStyles?.rowGap || trackStyles?.gap || '0') || 0

    mobileInlineHeight.value =
      months.reduce((height, month) => height + month.offsetHeight, 0) +
      gap * Math.max(months.length - 1, 0)
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

  async function prependMobileMonths() {
    if (
      !options.isMobileScroll.value ||
      mobileMutating.value ||
      !mobileWindowStart.value
    ) {
      return
    }

    let added = 0

    for (let index = 1; index <= MOBILE_LOAD_MONTH_STEP; index += 1) {
      const month = options.adapter.startOfMonth(
        options.adapter.addMonths(mobileWindowStart.value, -index),
      )

      if (!canRenderMonth(month)) break

      added += 1
    }

    if (!added) return

    const reference = captureMonthScrollReference()

    mobileMutating.value = true
    mobileWindowStart.value = options.adapter.startOfMonth(
      options.adapter.addMonths(mobileWindowStart.value, -added),
    )
    mobileWindowCount.value = Math.min(
      mobileWindowCount.value + added,
      MOBILE_MAX_RENDERED_MONTHS,
    )
    syncMobileVisibleMonths()

    await nextTick()
    restoreMonthScrollReference(reference)
    mobileMutating.value = false
  }

  async function appendMobileMonths() {
    if (
      !options.isMobileScroll.value ||
      mobileMutating.value ||
      !mobileWindowStart.value
    ) {
      return
    }

    const renderedMonths = mobileVisibleMonths.value
    const lastMonth = renderedMonths.at(-1)
    if (!lastMonth) return

    let added = 0

    for (let index = 1; index <= MOBILE_LOAD_MONTH_STEP; index += 1) {
      const month = options.adapter.startOfMonth(
        options.adapter.addMonths(lastMonth, index),
      )

      if (!canRenderMonth(month)) break

      added += 1
    }

    if (!added) return

    const overflow = Math.max(
      mobileWindowCount.value + added - MOBILE_MAX_RENDERED_MONTHS,
      0,
    )
    const reference = captureMonthScrollReference()

    mobileMutating.value = true

    if (overflow) {
      mobileWindowStart.value = options.adapter.startOfMonth(
        options.adapter.addMonths(mobileWindowStart.value, overflow),
      )
    }

    mobileWindowCount.value = Math.min(
      mobileWindowCount.value + added,
      MOBILE_MAX_RENDERED_MONTHS,
    )
    syncMobileVisibleMonths()

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
    [
      options.isMobileScroll,
      options.displayedMonth,
    ],
    ([mobile, displayedMonth]) => {
      if (!mobile) {
        mobileWindowStart.value = null
        mobileWindowCount.value = 0
        mobileVisibleMonths.value = []
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

      if (options.selectionChangeOrigin.value === 'internal') {
        rebuildWindowFromAvailabilityChange(anchorMonth)
        return
      }

      resetWindow(anchorMonth)
    },
  )

  watch(
    [
      options.range,
      options.min,
      options.max,
      options.allowedDates,
      options.allowedStartDates,
      options.allowedEndDates,
    ],
    () => {
      if (!options.isMobileScroll.value) return

      resetWindow(options.displayedMonth.value)
    },
  )

  watch(options.selectionTargetField, () => {
    if (!options.isMobileScroll.value) return

    rebuildWindowFromAvailabilityChange(
      options.selection.value.start ?? options.displayedMonth.value,
    )
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
    monthsTrackKey,
    monthsStyle,
    onMonthsScroll,
    resetWindow,
    scrollMonthIntoView,
    handleMonthsRendered,
  }
}
