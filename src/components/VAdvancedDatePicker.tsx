import type { PropType } from 'vue'
import {
  Transition,
  computed,
  defineComponent,
  inject,
  nextTick,
  onBeforeUnmount,
  ref,
  toRef,
  watch,
} from 'vue'

import { VBtn, VDivider, VSheet } from 'vuetify/components'
import { useDate, useDisplay } from 'vuetify'

import { useAdvancedDateGrid } from '@/composables/useAdvancedDateGrid'
import { useAdvancedDateModel } from '@/composables/useAdvancedDateModel'
import { useAdvancedDateNavigation } from '@/composables/useAdvancedDateNavigation'
import { usePresetRanges } from '@/composables/usePresetRanges'
import { useRovingFocus } from '@/composables/useRovingFocus'
import type {
  AdvancedDateAdapter,
  AdvancedDateModel,
  DateBounds,
  PresetRange,
} from '@/types'
import { dateKey, isRangeDisabled } from '@/util/dates'
import { serializeModel } from '@/util/model'

import '@/styles/VAdvancedDatePicker.sass'

import { VAdvancedDateActions } from './VAdvancedDateActions'
import { VAdvancedDateMonth } from './VAdvancedDateMonth'
import { VAdvancedDatePresets } from './VAdvancedDatePresets'
import { advancedDateMobilePresentationKey } from './mobilePresentation'

function clampMonthCount(value: number): number {
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1
}

const MOBILE_INITIAL_PREVIOUS_MONTHS = 1
const MOBILE_INITIAL_NEXT_MONTHS = 5
const MOBILE_LOAD_MONTH_STEP = 3
const MOBILE_MAX_RENDERED_MONTHS = 10

export const VAdvancedDatePicker = defineComponent({
  name: 'VAdvancedDatePicker',

  props: {
    modelValue: {
      type: [Object, Array, Date, String, Number] as PropType<
        AdvancedDateModel<unknown>
      >,
      default: null,
    },
    range: {
      type: Boolean,
      default: true,
    },
    returnObject: Boolean,
    months: {
      type: Number,
      default: 2,
    },
    month: Number,
    year: Number,
    presets: Array as PropType<PresetRange<unknown>[]>,
    showPresets: {
      type: Boolean,
      default: true,
    },
    swipeable: {
      type: Boolean,
      default: true,
    },
    autoApply: {
      type: Boolean,
      default: true,
    },
    min: {
      type: [Object, Date, String, Number] as PropType<unknown>,
      default: null,
    },
    max: {
      type: [Object, Date, String, Number] as PropType<unknown>,
      default: null,
    },
    allowedDates: Function as PropType<(date: unknown) => boolean>,
    allowedStartDates: Function as PropType<(date: unknown) => boolean>,
    allowedEndDates: Function as PropType<(date: unknown) => boolean>,
    showWeekNumbers: Boolean,
    firstDayOfWeek: [String, Number] as PropType<string | number>,
    disabled: Boolean,
    readonly: Boolean,
    color: {
      type: String,
      default: 'primary',
    },
    theme: String,
    rounded: {
      type: [String, Number, Boolean],
      default: undefined,
    },
    border: {
      type: [String, Number, Boolean],
      default: true,
    },
    elevation: {
      type: [String, Number],
      default: 2,
    },
    width: [String, Number],
    minWidth: [String, Number],
    maxWidth: [String, Number],
    density: {
      type: String as PropType<'default' | 'comfortable' | 'compact'>,
      default: 'default',
    },
  },

  emits: {
    'update:modelValue': (_value: AdvancedDateModel<unknown>) => true,
    'update:month': (_value: number) => true,
    'update:year': (_value: number) => true,
    apply: (_value: AdvancedDateModel<unknown>) => true,
    cancel: () => true,
    presetSelect: (_preset: PresetRange<unknown>) => true,
  },

  setup(props, { emit, expose, slots }) {
    const adapter = useDate() as AdvancedDateAdapter<unknown>
    const display = useDisplay()
    const mobilePresentation = inject(
      advancedDateMobilePresentationKey,
      computed(() => null),
    )
    const containerRef = ref<HTMLElement | null>(null)
    const monthsTrackRef = ref<HTMLElement | null>(null)
    const dayButtons = ref<HTMLButtonElement[]>([])
    const dayButtonLookup = ref(new Map<string, HTMLButtonElement>())
    const mobileWindowStart = ref<unknown | null>(null)
    const mobileWindowCount = ref(0)
    const mobileInlineHeight = ref<number | null>(null)
    const mobileMutating = ref(false)
    const pendingMobileScrollMonthKey = ref('')
    const now = adapter.startOfDay(adapter.date() as unknown)
    let scrollFrame = 0

    const monthRef = computed(() => props.month ?? adapter.getMonth(now))
    const yearRef = computed(() => props.year ?? adapter.getYear(now))
    const monthsRef = computed(() => clampMonthCount(props.months))
    const disabledRef = computed(() => props.disabled || props.readonly)
    const isMobileScroll = computed(
      () => display.mobile.value && !!mobilePresentation.value,
    )
    const isMobileFullscreen = computed(
      () => isMobileScroll.value && mobilePresentation.value === 'fullscreen',
    )
    const navigationMonthsRef = computed(() =>
      isMobileScroll.value ? 1 : monthsRef.value,
    )
    const minMonth = computed(() =>
      props.min ? adapter.startOfMonth(props.min) : null,
    )
    const maxMonth = computed(() =>
      props.max ? adapter.startOfMonth(props.max) : null,
    )

    const model = useAdvancedDateModel({
      adapter,
      modelValue: toRef(props, 'modelValue'),
      range: toRef(props, 'range'),
      returnObject: toRef(props, 'returnObject'),
      autoApply: toRef(props, 'autoApply'),
      min: toRef(props, 'min'),
      max: toRef(props, 'max'),
      allowedDates: toRef(props, 'allowedDates'),
      allowedStartDates: toRef(props, 'allowedStartDates'),
      allowedEndDates: toRef(props, 'allowedEndDates'),
      onUpdate: (value) => emit('update:modelValue', value),
      onCancel: () => emit('cancel'),
    })

    const constraints = computed<DateBounds<unknown>>(() => ({
      min: props.min,
      max: props.max,
      allowedDates: props.allowedDates,
      allowedStartDates: props.allowedStartDates,
      allowedEndDates: props.allowedEndDates,
    }))

    const navigation = useAdvancedDateNavigation({
      adapter,
      modelValue: toRef(props, 'modelValue'),
      range: toRef(props, 'range'),
      months: navigationMonthsRef,
      month: monthRef,
      year: yearRef,
      min: toRef(props, 'min'),
      max: toRef(props, 'max'),
      onMonthChange: (value) => emit('update:month', value),
      onYearChange: (value) => emit('update:year', value),
    })

    const mobileWindowBaseCount = computed(() =>
      Math.max(monthsRef.value + MOBILE_INITIAL_NEXT_MONTHS, 7),
    )

    function buildMobileMonthWindow(start: unknown, count: number): unknown[] {
      const months: unknown[] = []

      for (let index = 0; index < count; index += 1) {
        const month = adapter.startOfMonth(adapter.addMonths(start, index))
        if (maxMonth.value && adapter.isAfter(month, maxMonth.value)) break
        months.push(month)
      }

      return months
    }

    function createMobileWindowStart(anchor: unknown) {
      let start = adapter.startOfMonth(anchor)

      for (let index = 0; index < MOBILE_INITIAL_PREVIOUS_MONTHS; index += 1) {
        const previous = adapter.startOfMonth(adapter.addMonths(start, -1))
        if (minMonth.value && adapter.isBefore(previous, minMonth.value)) break
        start = previous
      }

      return start
    }

    function resetMobileWindow(anchor: unknown) {
      const targetMonth = adapter.startOfMonth(anchor)

      mobileWindowStart.value = createMobileWindowStart(targetMonth)
      mobileWindowCount.value = mobileWindowBaseCount.value
      pendingMobileScrollMonthKey.value = dateKey(adapter, targetMonth)
    }

    const mobileVisibleMonths = computed(() => {
      if (!mobileWindowStart.value) return []
      return buildMobileMonthWindow(
        mobileWindowStart.value,
        mobileWindowCount.value,
      )
    })

    const visibleMonths = computed(() =>
      isMobileScroll.value
        ? mobileVisibleMonths.value
        : navigation.visibleMonths.value,
    )

    const isReverse = ref(false)

    watch(navigation.displayedMonth, (value, oldValue) => {
      if (!oldValue) return

      isReverse.value = adapter.isBefore(value, oldValue)
    })

    const grid = useAdvancedDateGrid({
      adapter,
      visibleMonths,
      selection: model.normalized,
      hoveredDate: model.hoveredDate,
      range: toRef(props, 'range'),
      showWeekNumbers: toRef(props, 'showWeekNumbers'),
      firstDayOfWeek: toRef(props, 'firstDayOfWeek'),
      min: toRef(props, 'min'),
      max: toRef(props, 'max'),
      allowedDates: toRef(props, 'allowedDates'),
      allowedStartDates: toRef(props, 'allowedStartDates'),
      allowedEndDates: toRef(props, 'allowedEndDates'),
    })

    const presetRanges = usePresetRanges({
      adapter,
      presets: toRef(props, 'presets'),
      range: toRef(props, 'range'),
      selection: model.normalized,
      isDisabled: (range) => isRangeDisabled(adapter, range, constraints.value),
    })

    const dayLookup = computed(() => {
      return new Map(
        grid.staticMonths.value.flatMap((month) =>
          month.weeks.flatMap((week) =>
            week.days.map((day) => [day.key, day.date] as const),
          ),
        ),
      )
    })

    const firstAvailableDay = computed(() => {
      return grid.months.value
        .flatMap((month) => month.weeks)
        .flatMap((week) => week.days)
        .find((day) => !day.outside && !day.disabled)
    })

    const monthLookup = computed(
      () =>
        new Map(
          grid.staticMonths.value.map((month) => [month.key, month.date]),
        ),
    )

    const monthsTrackKey = computed(() =>
      grid.staticMonths.value.map((month) => month.key).join(':'),
    )

    const monthTransition = computed(() =>
      isReverse.value ? 'picker-reverse-transition' : 'picker-transition',
    )

    const monthsStyle = computed(() => {
      const style: Record<string, string> = {
        touchAction: 'pan-y',
      }

      if (
        isMobileScroll.value &&
        !isMobileFullscreen.value &&
        mobileInlineHeight.value
      ) {
        style.blockSize = `${mobileInlineHeight.value}px`
      }

      return style
    })

    function setMonthsTrackRef(element: unknown) {
      if (element instanceof HTMLElement) monthsTrackRef.value = element
      else monthsTrackRef.value = null
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
      if (!isMobileScroll.value || isMobileFullscreen.value) {
        mobileInlineHeight.value = null
        return
      }

      const months = getMonthElements().slice(0, monthsRef.value)
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

    function refreshDayButtons() {
      const buttons = Array.from(
        (
          monthsTrackRef.value ?? containerRef.value
        )?.querySelectorAll<HTMLButtonElement>('button[data-date]') ?? [],
      )

      dayButtons.value = buttons
      dayButtonLookup.value = new Map(
        buttons.flatMap((button) =>
          button.dataset.date ? [[button.dataset.date, button] as const] : [],
        ),
      )
    }

    // Preserve the leading visible month when the mobile window grows or trims.
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

    function scrollMonthIntoView(month: unknown) {
      const container = containerRef.value
      const element = findMonthElement(dateKey(adapter, month))
      if (!container || !element) return

      container.scrollTop = element.offsetTop
    }

    function syncDisplayedMonthFromScroll() {
      if (!isMobileScroll.value) return

      const key = getLeadingVisibleMonthElement()?.dataset.month
      if (!key) return

      const month = monthLookup.value.get(key)
      if (month) navigation.setDisplayedMonth(month)
    }

    async function prependMobileMonths() {
      if (
        !isMobileScroll.value ||
        mobileMutating.value ||
        !mobileWindowStart.value
      )
        return

      let added = 0

      for (let index = 1; index <= MOBILE_LOAD_MONTH_STEP; index += 1) {
        const month = adapter.startOfMonth(
          adapter.addMonths(mobileWindowStart.value, -index),
        )

        if (minMonth.value && adapter.isBefore(month, minMonth.value)) break
        added += 1
      }

      if (!added) return

      const reference = captureMonthScrollReference()

      mobileMutating.value = true
      mobileWindowStart.value = adapter.startOfMonth(
        adapter.addMonths(mobileWindowStart.value, -added),
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
        !isMobileScroll.value ||
        mobileMutating.value ||
        !mobileWindowStart.value
      )
        return

      const renderedMonths = mobileVisibleMonths.value
      const lastMonth = renderedMonths.at(-1)
      if (!lastMonth) return

      let added = 0

      for (let index = 1; index <= MOBILE_LOAD_MONTH_STEP; index += 1) {
        const month = adapter.startOfMonth(adapter.addMonths(lastMonth, index))

        if (maxMonth.value && adapter.isAfter(month, maxMonth.value)) break
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
        mobileWindowStart.value = adapter.startOfMonth(
          adapter.addMonths(mobileWindowStart.value, overflow),
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
      if (!isMobileScroll.value || scrollFrame) return

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

    onBeforeUnmount(() => {
      if (!scrollFrame) return
      cancelAnimationFrame(scrollFrame)
    })

    watch(
      [isMobileScroll, navigation.displayedMonth, minMonth, maxMonth],
      ([mobile, displayedMonth]) => {
        if (!mobile) {
          mobileWindowStart.value = null
          mobileWindowCount.value = 0
          mobileInlineHeight.value = null
          return
        }

        const visible = mobileVisibleMonths.value.some((month) =>
          adapter.isSameMonth(month, displayedMonth),
        )

        if (!visible) resetMobileWindow(displayedMonth)
      },
      { immediate: true },
    )

    watch(
      [monthsTrackKey, isMobileScroll, isMobileFullscreen, monthsRef],
      async () => {
        await nextTick()
        refreshDayButtons()
        measureMobileInlineHeight()

        if (!pendingMobileScrollMonthKey.value) return

        const month = monthLookup.value.get(pendingMobileScrollMonthKey.value)
        if (month) scrollMonthIntoView(month)
        pendingMobileScrollMonthKey.value = ''
      },
      { immediate: true },
    )

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

    async function focusDate(date: unknown) {
      const targetMonth = adapter.startOfMonth(date)
      const visible = visibleMonths.value.some((month) =>
        adapter.isSameMonth(month, targetMonth),
      )

      if (isMobileScroll.value) {
        if (!visible) resetMobileWindow(targetMonth)
        navigation.setDisplayedMonth(targetMonth)
      } else if (!visible) {
        navigation.setDisplayedMonth(targetMonth)
      }

      await nextTick()
      refreshDayButtons()

      if (isMobileScroll.value) scrollMonthIntoView(targetMonth)

      const targetKey = dateKey(adapter, date)
      const referenceDate =
        focus.activeDate.value ?? model.normalized.value.start ?? date
      const direction = adapter.isBefore(date, referenceDate) ? -1 : 1
      const direct = dayButtonLookup.value.get(targetKey) ?? null
      const button = direct?.disabled
        ? findFocusableButton(targetKey, direction)
        : direct

      button?.focus()

      const resolved = button?.dataset.date
        ? dayLookup.value.get(button.dataset.date)
        : null
      if (resolved) focus.setActiveDate(resolved)
    }

    function focusActiveDate() {
      const fallback =
        focus.activeDate.value ??
        model.normalized.value.start ??
        firstAvailableDay.value?.date

      if (!fallback) return

      void focusDate(fallback)
    }

    const focus = useRovingFocus({
      adapter,
      firstDayOfWeek: toRef(props, 'firstDayOfWeek'),
      onFocusDate: focusDate,
      onSelect: (date) => model.selectDate(date),
      onEscape: () => emit('cancel'),
    })

    const activeDateKey = computed(() => {
      const preferredKey = focus.activeDate.value
        ? dateKey(adapter, focus.activeDate.value)
        : model.normalized.value.start
          ? dateKey(adapter, model.normalized.value.start)
          : ''

      if (preferredKey) {
        const preferredDay = grid.months.value
          .flatMap((month) => month.weeks)
          .flatMap((week) => week.days)
          .find(
            (day) => day.key === preferredKey && !day.outside && !day.disabled,
          )

        if (preferredDay) return preferredDay.key
      }

      return firstAvailableDay.value?.key ?? ''
    })

    const liveText = computed(() => {
      const labels = isMobileScroll.value
        ? adapter.format(navigation.displayedMonth.value, 'monthAndYear')
        : grid.staticMonths.value.map((month) => month.label).join(', ')

      if (
        props.range &&
        model.normalized.value.start &&
        model.normalized.value.end
      ) {
        return `Selected range ${adapter.format(model.normalized.value.start, 'fullDate')} to ${adapter.format(model.normalized.value.end, 'fullDate')}. ${labels}`
      }

      if (!props.range && model.normalized.value.start) {
        return `Selected date ${adapter.format(model.normalized.value.start, 'fullDate')}. ${labels}`
      }

      return labels
    })

    function handleApply() {
      if (!model.apply()) return
      emit(
        'apply',
        serializeModel(model.normalized.value, {
          range: props.range,
          returnObject: props.returnObject,
        }),
      )
    }

    function handlePresetSelect(preset: PresetRange<unknown>) {
      if (!model.selectPreset(preset)) return
      emit('presetSelect', preset)
    }

    async function scrollToAdjacentMonth(offset: -1 | 1) {
      const canMove =
        offset < 0 ? navigation.canPrev.value : navigation.canNext.value
      if (!canMove) return

      if (!isMobileScroll.value) {
        if (offset < 0) navigation.prevMonth()
        else navigation.nextMonth()
        return
      }

      const targetMonth = adapter.startOfMonth(
        adapter.addMonths(navigation.displayedMonth.value, offset),
      )

      resetMobileWindow(targetMonth)
      navigation.setDisplayedMonth(targetMonth)

      await nextTick()
      scrollMonthIntoView(targetMonth)
    }

    function prevMonth() {
      void scrollToAdjacentMonth(-1)
    }

    function nextMonth() {
      void scrollToAdjacentMonth(1)
    }

    expose({
      focusDate,
      focusActiveDate,
      prevMonth,
      nextMonth,
    })

    return () => (
      <VSheet
        class={[
          'v-advanced-date-picker',
          `v-advanced-date-picker--density-${props.density}`,
          {
            'v-advanced-date-picker--stacked': display.mobile.value,
            'v-advanced-date-picker--mobile-fullscreen':
              isMobileFullscreen.value,
            'v-advanced-date-picker--mobile-scroll': isMobileScroll.value,
          },
        ]}
        color="surface"
        theme={props.theme}
        rounded={props.rounded}
        border={props.border}
        elevation={props.elevation}
        width={props.width}
        minWidth={props.minWidth}
        maxWidth={props.maxWidth}
        style={{
          '--v-advanced-date-picker-color': `rgb(var(--v-theme-${props.color}))`,
        }}
      >
        <div
          class="v-advanced-date-picker__live"
          aria-live="polite"
          aria-atomic="true"
        >
          {liveText.value}
        </div>

        <div class="v-advanced-date-picker__body">
          {props.showPresets &&
          props.range &&
          presetRanges.presets.value.length ? (
            <>
              <VAdvancedDatePresets
                presets={presetRanges.presets.value}
                disabled={disabledRef.value}
                isActive={presetRanges.isPresetActive}
                isDisabled={presetRanges.isPresetDisabled}
                onSelect={handlePresetSelect}
                v-slots={slots}
              />
              <VDivider vertical={!display.mobile.value} />
            </>
          ) : null}

          <div
            ref={containerRef}
            class={[
              'v-advanced-date-picker__months',
              {
                'v-advanced-date-picker__months--mobile-scroll':
                  isMobileScroll.value,
              },
            ]}
            style={monthsStyle.value}
            onMouseleave={() => model.setHoverDate(null)}
            onScroll={isMobileScroll.value ? onMonthsScroll : undefined}
          >
            {!isMobileScroll.value ? (
              <VBtn
                {...({
                  class: [
                    'v-advanced-date-picker__nav',
                    'v-advanced-date-picker__nav--prev',
                  ],
                  icon: 'mdi-chevron-left',
                  variant: 'text',
                  disabled: !navigation.canPrev.value || props.disabled,
                  'aria-label': 'Previous month',
                  onClick: prevMonth,
                } as any)}
              />
            ) : null}

            {!isMobileScroll.value ? (
              <Transition name={monthTransition.value}>
                <div
                  ref={setMonthsTrackRef}
                  key={monthsTrackKey.value}
                  class="v-advanced-date-picker__months-track"
                >
                  {grid.months.value.map((month) => (
                    <VAdvancedDateMonth
                      key={month.key}
                      month={month}
                      activeDateKey={activeDateKey.value}
                      showWeekNumbers={props.showWeekNumbers}
                      onSelect={model.selectDate}
                      onHover={model.setHoverDate}
                      onFocusDate={focus.setActiveDate}
                      onKeydown={focus.onKeydown}
                      v-slots={slots}
                    />
                  ))}
                </div>
              </Transition>
            ) : (
              <div
                ref={setMonthsTrackRef}
                class="v-advanced-date-picker__months-track"
              >
                {grid.months.value.map((month) => (
                  <VAdvancedDateMonth
                    key={month.key}
                    month={month}
                    activeDateKey={activeDateKey.value}
                    showWeekNumbers={props.showWeekNumbers}
                    onSelect={model.selectDate}
                    onHover={model.setHoverDate}
                    onFocusDate={focus.setActiveDate}
                    onKeydown={focus.onKeydown}
                    v-slots={slots}
                  />
                ))}
              </div>
            )}

            {!isMobileScroll.value ? (
              <VBtn
                {...({
                  class: [
                    'v-advanced-date-picker__nav',
                    'v-advanced-date-picker__nav--next',
                  ],
                  icon: 'mdi-chevron-right',
                  variant: 'text',
                  disabled: !navigation.canNext.value || props.disabled,
                  'aria-label': 'Next month',
                  onClick: nextMonth,
                } as any)}
              />
            ) : null}
          </div>
        </div>

        {!props.autoApply && !props.readonly ? (
          <>
            <VDivider />
            <VAdvancedDateActions
              disabled={props.disabled}
              onApply={handleApply}
              onCancel={model.cancel}
              v-slots={slots}
            />
          </>
        ) : null}
      </VSheet>
    )
  },
})
