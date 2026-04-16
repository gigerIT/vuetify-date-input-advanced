import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  watch,
  type Ref,
} from 'vue'

import type { AdvancedDateAdapter } from '@/types'
import { dateKey } from '@/util/dates'

const MOBILE_INITIAL_PREVIOUS_MONTHS = 1
const MOBILE_INITIAL_NEXT_MONTHS = 5
const MOBILE_LOAD_MONTH_STEP = 3
const MOBILE_MAX_RENDERED_MONTHS = 10

export function useAdvancedDatePickerMobileWindow<TDate>(options: {
  adapter: AdvancedDateAdapter<TDate>
  desktopVisibleMonths: Ref<TDate[]>
  displayedMonth: Ref<TDate>
  setDisplayedMonth: (month: TDate) => void
  isMobileScroll: Ref<boolean>
  isMobileFullscreen: Ref<boolean>
  months: Ref<number>
  minMonth: Ref<TDate | null>
  maxMonth: Ref<TDate | null>
}) {
  const containerRef = ref<HTMLElement | null>(null)
  const monthsTrackRef = ref<HTMLElement | null>(null)
  const mobileWindowStart = ref<TDate | null>(null)
  const mobileWindowCount = ref(0)
  const mobileInlineHeight = ref<number | null>(null)
  const mobileMutating = ref(false)
  const pendingMobileScrollMonthKey = ref('')
  let scrollFrame = 0

  const mobileWindowBaseCount = computed(() =>
    Math.max(options.months.value + MOBILE_INITIAL_NEXT_MONTHS, 7),
  )

  function buildMobileMonthWindow(start: TDate, count: number): TDate[] {
    const months: TDate[] = []

    for (let index = 0; index < count; index += 1) {
      const month = options.adapter.startOfMonth(
        options.adapter.addMonths(start, index),
      )
      if (
        options.maxMonth.value &&
        options.adapter.isAfter(month, options.maxMonth.value)
      ) {
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

      if (
        options.minMonth.value &&
        options.adapter.isBefore(previous, options.minMonth.value)
      ) {
        break
      }

      start = previous
    }

    return start
  }

  function resetWindow(anchor: TDate) {
    const targetMonth = options.adapter.startOfMonth(anchor)

    mobileWindowStart.value = createWindowStart(targetMonth)
    mobileWindowCount.value = mobileWindowBaseCount.value
    pendingMobileScrollMonthKey.value = dateKey(options.adapter, targetMonth)
  }

  const mobileVisibleMonths = computed(() => {
    if (!mobileWindowStart.value) return []
    return buildMobileMonthWindow(
      mobileWindowStart.value,
      mobileWindowCount.value,
    )
  })

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

      if (
        options.minMonth.value &&
        options.adapter.isBefore(month, options.minMonth.value)
      ) {
        break
      }

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

      if (
        options.maxMonth.value &&
        options.adapter.isAfter(month, options.maxMonth.value)
      ) {
        break
      }

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
      options.minMonth,
      options.maxMonth,
    ],
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
