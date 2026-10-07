import {
  Transition,
  Fragment,
  computed,
  defineComponent,
  nextTick,
  ref,
  toRef,
  watch,
} from 'vue'

import { VBtn, VCard, VDivider } from 'vuetify/components'
import { useDate, useDisplay } from 'vuetify'

import { useAdvancedDateGrid } from '@/composables/useAdvancedDateGrid'
import {
  useAdvancedDateMonthAvailability,
  type MonthSearchResult,
} from '@/composables/useAdvancedDateMonthAvailability'
import { useAdvancedDateModel } from '@/composables/useAdvancedDateModel'
import { useDateInputAdvancedLocale } from '@/composables/useDateInputAdvancedLocale'
import { useAdvancedDateNavigation } from '@/composables/useAdvancedDateNavigation'
import { useAdvancedDatePickerFocus } from '@/composables/useAdvancedDatePickerFocus'
import { useAdvancedDatePickerLiveText } from '@/composables/useAdvancedDatePickerLiveText'
import { useAdvancedDatePickerMobileWindow } from '@/composables/useAdvancedDatePickerMobileWindow'
import { usePresetRanges } from '@/composables/usePresetRanges'
import type {
  AdvancedDateAdapter,
  AdvancedDateModel,
  DateBounds,
  NormalizedRange,
  PresetRange,
} from '@/types'
import { isRangeDisabled } from '@/util/dates'
import { serializeModel } from '@/util/model'

import '@/styles/VAdvancedDatePicker.sass'

import {
  advancedDatePickerCardProps,
  advancedDatePickerInternalProps,
  advancedDatePickerProps,
} from './advancedDateProps'
import { VAdvancedDateActions } from './VAdvancedDateActions'
import { VAdvancedDateMonth } from './VAdvancedDateMonth'
import { VAdvancedDatePresets } from './VAdvancedDatePresets'

function clampMonthCount(value: number): number {
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1
}

function isSameSelection<TDate>(
  adapter: AdvancedDateAdapter<TDate>,
  left: NormalizedRange<TDate>,
  right: NormalizedRange<TDate>,
) {
  const sameStart =
    (!left.start && !right.start) ||
    (!!left.start &&
      !!right.start &&
      adapter.isSameDay(left.start, right.start))
  const sameEnd =
    (!left.end && !right.end) ||
    (!!left.end && !!right.end && adapter.isSameDay(left.end, right.end))

  return sameStart && sameEnd
}

export const VAdvancedDatePicker = defineComponent({
  name: 'VAdvancedDatePicker',

  props: {
    ...advancedDatePickerProps,
    ...advancedDatePickerCardProps,
    ...advancedDatePickerInternalProps,
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
    const { tDateInputAdvanced } = useDateInputAdvancedLocale()
    const now = adapter.startOfDay(adapter.date() as unknown)

    const monthRef = computed(() => props.month ?? adapter.getMonth(now))
    const yearRef = computed(() => props.year ?? adapter.getYear(now))
    const monthsRef = computed(() => clampMonthCount(props.months))
    const disabledRef = computed(() => props.disabled || props.readonly)
    const isMobileScroll = computed(
      () => display.mobile.value && !!props.mobilePresentation,
    )
    const isMobileFullscreen = computed(
      () => isMobileScroll.value && props.mobilePresentation === 'fullscreen',
    )
    const navigationMonthsRef = computed(() =>
      isMobileScroll.value ? 1 : monthsRef.value,
    )
    const localSelectionChangeOrigin = ref<'internal' | null>(null)
    const selectionChangeOrigin = computed<'external' | 'internal'>(() => {
      return localSelectionChangeOrigin.value ?? props.selectionChangeOrigin
    })

    const model = useAdvancedDateModel({
      adapter,
      modelValue: toRef(props, 'modelValue'),
      range: toRef(props, 'range'),
      selectionTargetField: toRef(props, 'selectionTargetField'),
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

    const monthAvailability = useAdvancedDateMonthAvailability({
      adapter,
      selection: model.normalized,
      selectionTargetField: toRef(props, 'selectionTargetField'),
      range: toRef(props, 'range'),
      bounds: constraints,
    })
    const navigation = useAdvancedDateNavigation({
      adapter,
      availability: monthAvailability,
      selection: model.normalized,
      selectionChangeOrigin,
      selectionTargetField: toRef(props, 'selectionTargetField'),
      range: toRef(props, 'range'),
      months: navigationMonthsRef,
      month: monthRef,
      year: yearRef,
      min: toRef(props, 'min'),
      max: toRef(props, 'max'),
      onMonthChange: (value) => emit('update:month', value),
      onYearChange: (value) => emit('update:year', value),
    })
    const mobileWindow = useAdvancedDatePickerMobileWindow({
      adapter,
      availability: monthAvailability,
      desktopVisibleMonths: navigation.visibleMonths,
      displayedMonth: navigation.displayedMonth,
      setDisplayedMonth: navigation.setDisplayedMonth,
      selectionChangeOrigin,
      isMobileScroll,
      isMobileFullscreen,
      months: monthsRef,
      selection: model.normalized,
    })

    const isReverse = ref(false)
    const gapAnnouncement = ref('')

    watch(
      [navigation.displayedMonth, model.normalized],
      () => {
        gapAnnouncement.value = ''
      },
      { flush: 'sync' },
    )

    watch(navigation.displayedMonth, (value, oldValue) => {
      if (!oldValue) return

      isReverse.value = adapter.isBefore(value, oldValue)
    })

    const grid = useAdvancedDateGrid({
      adapter,
      visibleMonths: mobileWindow.visibleMonths,
      selection: model.normalized,
      selectionTargetField: toRef(props, 'selectionTargetField'),
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

    const monthTransition = computed(() =>
      isReverse.value
        ? 'v-advanced-date-picker__calendar-slide-reverse'
        : 'v-advanced-date-picker__calendar-slide',
    )
    const monthsStyle = computed<Record<string, string>>(() => ({
      ...mobileWindow.monthsStyle.value,
      // Slide by one rendered month plus the shared gap so adjacent months
      // feel anchored during horizontal navigation.
      '--v-advanced-date-visible-month-count': String(
        mobileWindow.visibleMonths.value.length,
      ),
    }))
    const baseTitle = computed(() => props.title?.trim() ?? '')
    const startDateTitle = computed(() => props.titleStartDate?.trim() ?? '')
    const endDateTitle = computed(() => props.titleEndDate?.trim() ?? '')
    const pickerTitle = computed(() => {
      if (!props.range) return baseTitle.value

      const selection = model.normalized.value

      if (!selection.start && !selection.end) {
        return startDateTitle.value || baseTitle.value
      }

      if (selection.start && !selection.end) {
        return endDateTitle.value || baseTitle.value
      }

      return baseTitle.value
    })

    function markInternalSelectionChange() {
      localSelectionChangeOrigin.value = 'internal'
    }

    function handleSelectDate(date: unknown) {
      if (disabledRef.value) return

      const previousSelection = {
        start: model.normalized.value.start,
        end: model.normalized.value.end,
      } as NormalizedRange<unknown>

      markInternalSelectionChange()
      model.selectDate(date)

      if (isSameSelection(adapter, previousSelection, model.normalized.value)) {
        localSelectionChangeOrigin.value = null
      }
    }

    function handleHoverDate(date: unknown | null) {
      if (disabledRef.value && date) return
      model.setHoverDate(date)
    }

    async function ensureDateVisible(date: unknown) {
      const targetMonth = adapter.startOfMonth(date)
      const visible = mobileWindow.visibleMonths.value.some((month) =>
        adapter.isSameMonth(month, targetMonth),
      )

      if (isMobileScroll.value) {
        if (!visible) mobileWindow.resetWindow(targetMonth)
        navigation.setDisplayedMonth(targetMonth)
      } else if (!visible) {
        navigation.setDisplayedMonth(targetMonth)
      }

      await nextTick()

      if (isMobileScroll.value) {
        mobileWindow.scrollMonthIntoView(targetMonth)
      }
    }

    async function realignSelectionViewport(date: unknown) {
      const targetMonth = adapter.startOfMonth(date)
      const visible = mobileWindow.visibleMonths.value.some((month) =>
        adapter.isSameMonth(month, targetMonth),
      )

      if (visible) return

      if (isMobileScroll.value) {
        mobileWindow.resetWindow(targetMonth)
        navigation.setDisplayedMonth(targetMonth, false)

        await nextTick()
        mobileWindow.scrollMonthIntoView(targetMonth)
        return
      }

      navigation.setDisplayedMonth(targetMonth, false)
      await nextTick()
    }

    const focus = useAdvancedDatePickerFocus({
      adapter,
      months: grid.months,
      selection: model.normalized,
      selectionTargetField: toRef(props, 'selectionTargetField'),
      firstDayOfWeek: toRef(props, 'firstDayOfWeek'),
      containerRef: mobileWindow.containerRef,
      monthsTrackRef: mobileWindow.monthsTrackRef,
      ensureDateVisible,
      onPageDate: (date, direction, byYear) => {
        if (disabledRef.value) return
        const requested = byYear
          ? adapter.setYear(date, adapter.getYear(date) + direction)
          : adapter.addMonths(date, direction)
        const from = adapter.addMonths(
          adapter.startOfMonth(requested),
          -direction,
        )
        const result = monthAvailability.find(from, direction)
        if (result.kind === 'found') {
          const target = adapter.isSameMonth(requested, result.month)
            ? requested
            : result.month
          const skipped =
            direction > 0
              ? monthAvailability.gap(from, result.month)
              : monthAvailability.gap(result.month, from)
          gapAnnouncement.value = skipped ? describeGap(skipped) : ''
          void focus.focusDate(target)
        } else if (result.kind === 'pending') {
          // Keep keyboard users on a reachable control when the next batch is
          // unknown; the same continuation action is available in both views.
          const control =
            mobileWindow.containerRef.value?.querySelector<HTMLButtonElement>(
              `[data-search-direction="${direction < 0 ? 'prev' : 'next'}"]`,
            )
          control?.focus()
        }
      },
      onSelect: handleSelectDate,
      onEscape: () => {
        props.onEscapeKey?.()
        emit('cancel')
      },
    })
    const liveText = useAdvancedDatePickerLiveText({
      adapter,
      range: toRef(props, 'range'),
      isMobileScroll,
      displayedMonth: navigation.displayedMonth,
      months: grid.staticMonths,
      selection: model.normalized,
    })

    watch(
      [
        mobileWindow.monthsTrackKey,
        isMobileScroll,
        isMobileFullscreen,
        monthsRef,
      ],
      async () => {
        await nextTick()
        focus.refreshDayButtons()
        mobileWindow.handleMonthsRendered()
      },
      { immediate: true },
    )

    watch(disabledRef, (value) => {
      if (value) model.setHoverDate(null)
    })

    watch(
      model.normalized,
      (value) => {
        const origin = selectionChangeOrigin.value

        props.onDraftChange?.(value as NormalizedRange<unknown>, { origin })

        if (localSelectionChangeOrigin.value !== 'internal') return

        void nextTick(() => {
          if (localSelectionChangeOrigin.value === 'internal') {
            localSelectionChangeOrigin.value = null
          }
        })
      },
      { immediate: true },
    )

    function handleApply() {
      if (disabledRef.value) return
      if (!model.apply()) return
      emit(
        'apply',
        serializeModel(model.normalized.value, {
          range: props.range,
          returnObject: props.returnObject,
        }),
      )
    }

    async function handlePresetSelect(preset: PresetRange<unknown>) {
      if (disabledRef.value) return

      markInternalSelectionChange()
      if (!model.selectPreset(preset)) {
        localSelectionChangeOrigin.value = null
        return
      }

      if (model.normalized.value.start) {
        await realignSelectionViewport(model.normalized.value.start)
      }

      emit('presetSelect', preset)
    }

    async function scrollToAdjacentMonth(offset: -1 | 1) {
      if (disabledRef.value) return
      const before = navigation.displayedMonth.value
      if (offset < 0) navigation.prevMonth()
      else navigation.nextMonth()
      const after = navigation.displayedMonth.value
      const skipped =
        offset > 0
          ? monthAvailability.gap(before, after)
          : monthAvailability.gap(after, before)
      gapAnnouncement.value = skipped ? describeGap(skipped) : ''
      if (isMobileScroll.value && !adapter.isSameMonth(before, after)) {
        mobileWindow.resetWindow(after)
        await nextTick()
        mobileWindow.scrollMonthIntoView(after)
      }
    }

    function describeGap(gap: { start: unknown; end: unknown }) {
      const start = adapter.format(gap.start, 'monthAndYear')
      const period = adapter.isSameMonth(gap.start, gap.end)
        ? start
        : `${start} – ${adapter.format(gap.end, 'monthAndYear')}`
      return tDateInputAdvanced('navigation.unavailablePeriod', period)
    }

    const visibleGaps = computed(() =>
      mobileWindow.visibleMonths.value.flatMap((month, index, months) => {
        if (!index) return []
        const gap = monthAvailability.gap(months[index - 1], month)
        return gap ? [{ before: month, label: describeGap(gap) }] : []
      }),
    )

    const desktopGaps = computed(() => {
      if (
        visibleGaps.value.length ||
        navigation.visibleMonths.value.length !== 1
      )
        return visibleGaps.value
      const month = navigation.displayedMonth.value
      const next = navigation.next.value
      const previous = navigation.previous.value
      const gap =
        next.kind === 'found'
          ? monthAvailability.gap(month, next.month)
          : previous.kind === 'found'
            ? monthAvailability.gap(previous.month, month)
            : null
      return gap ? [{ before: month, label: describeGap(gap) }] : []
    })

    function navigationDescription(
      result: MonthSearchResult<unknown>,
      direction: -1 | 1,
    ) {
      if (result.kind === 'boundary') return undefined
      return result.kind === 'found'
        ? tDateInputAdvanced(
            'navigation.jumpToMonth',
            adapter.format(result.month, 'monthAndYear'),
          )
        : tDateInputAdvanced(
            direction < 0
              ? 'navigation.searchEarlier'
              : 'navigation.searchLater',
          )
    }

    function renderSearch(direction: -1 | 1) {
      const result = isMobileScroll.value
        ? direction < 0
          ? mobileWindow.previous.value
          : mobileWindow.next.value
        : direction < 0
          ? navigation.previous.value
          : navigation.next.value
      if (result.kind !== 'pending') return null
      return (
        <div class="v-advanced-date-picker__search">
          <span role="status">
            {tDateInputAdvanced(
              direction < 0
                ? 'navigation.searchedEarlier'
                : 'navigation.searchedLater',
              adapter.format(result.through, 'monthAndYear'),
            )}
          </span>
          <VBtn
            variant="text"
            size="small"
            disabled={disabledRef.value}
            data-search-direction={direction < 0 ? 'prev' : 'next'}
            {...{
              onClick: () => {
                if (disabledRef.value) return
                if (isMobileScroll.value) {
                  if (direction < 0) void mobileWindow.prependMobileMonths(true)
                  else void mobileWindow.appendMobileMonths(true)
                } else void scrollToAdjacentMonth(direction)
              },
            }}
          >
            {tDateInputAdvanced(
              direction < 0
                ? 'navigation.searchEarlier'
                : 'navigation.searchLater',
            )}
          </VBtn>
        </div>
      )
    }

    function prevMonth() {
      void scrollToAdjacentMonth(-1)
    }

    function nextMonth() {
      void scrollToAdjacentMonth(1)
    }

    expose({
      focusDate: focus.focusDate,
      focusActiveDate: focus.focusActiveDate,
      prevMonth,
      nextMonth,
    })

    return () => (
      <VCard
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
        theme={props.theme}
        rounded={props.rounded}
        border={props.border}
        variant={props.variant}
        elevation={props.elevation}
        width={props.width}
        minWidth={props.minWidth}
        maxWidth={props.maxWidth}
      >
        <div
          class="v-advanced-date-picker__live"
          aria-live="polite"
          aria-atomic="true"
        >
          {[liveText.value, gapAnnouncement.value].filter(Boolean).join('. ')}
        </div>

        {pickerTitle.value ? (
          <div class="v-advanced-date-picker__title">{pickerTitle.value}</div>
        ) : null}

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
            ref={mobileWindow.containerRef}
            class={[
              'v-advanced-date-picker__months',
              {
                'v-advanced-date-picker__months--mobile-scroll':
                  isMobileScroll.value,
              },
            ]}
            style={monthsStyle.value}
            onMouseleave={() => handleHoverDate(null)}
            onScroll={
              isMobileScroll.value ? mobileWindow.onMonthsScroll : undefined
            }
          >
            {!isMobileScroll.value ? (
              <VBtn
                {...({
                  class: [
                    'v-advanced-date-picker__nav',
                    'v-advanced-date-picker__nav--prev',
                  ],
                  icon: props.prevIcon,
                  variant: 'text',
                  disabled: !navigation.canPrev.value || disabledRef.value,
                  title: navigationDescription(navigation.previous.value, -1),
                  'aria-label': tDateInputAdvanced('ariaLabel.previousMonth'),
                  onClick: prevMonth,
                } as any)}
              />
            ) : null}

            {!isMobileScroll.value ? (
              <div class="v-advanced-date-picker__months-viewport">
                <Transition name={monthTransition.value}>
                  <div
                    ref={mobileWindow.setMonthsTrackRef}
                    key={mobileWindow.monthsTrackKey.value}
                    class="v-advanced-date-picker__months-track"
                  >
                    {grid.months.value.map((month) => (
                      <VAdvancedDateMonth
                        key={month.key}
                        month={month}
                        disabled={disabledRef.value}
                        activeDateKey={focus.activeDateKey.value}
                        showWeekNumbers={props.showWeekNumbers}
                        onSelect={handleSelectDate}
                        onHover={handleHoverDate}
                        onFocusDate={focus.setActiveDate}
                        onKeydown={focus.onKeydown}
                        v-slots={slots}
                      />
                    ))}
                  </div>
                </Transition>
              </div>
            ) : (
              <div
                ref={mobileWindow.setMonthsTrackRef}
                class="v-advanced-date-picker__months-track"
              >
                {renderSearch(-1)}
                {grid.months.value.map((month) => (
                  <Fragment key={month.key}>
                    {visibleGaps.value.find((gap) =>
                      adapter.isSameMonth(gap.before, month.date),
                    ) ? (
                      <div
                        class="v-advanced-date-picker__gap"
                        key={`gap-${month.key}`}
                      >
                        {
                          visibleGaps.value.find((gap) =>
                            adapter.isSameMonth(gap.before, month.date),
                          )!.label
                        }
                      </div>
                    ) : null}
                    <VAdvancedDateMonth
                      key={month.key}
                      month={month}
                      disabled={disabledRef.value}
                      activeDateKey={focus.activeDateKey.value}
                      showWeekNumbers={props.showWeekNumbers}
                      onSelect={handleSelectDate}
                      onHover={handleHoverDate}
                      onFocusDate={focus.setActiveDate}
                      onKeydown={focus.onKeydown}
                      v-slots={slots}
                    />
                  </Fragment>
                ))}
                {renderSearch(1)}
              </div>
            )}

            {!isMobileScroll.value ? (
              <VBtn
                {...({
                  class: [
                    'v-advanced-date-picker__nav',
                    'v-advanced-date-picker__nav--next',
                  ],
                  icon: props.nextIcon,
                  variant: 'text',
                  disabled: !navigation.canNext.value || disabledRef.value,
                  title: navigationDescription(navigation.next.value, 1),
                  'aria-label': tDateInputAdvanced('ariaLabel.nextMonth'),
                  onClick: nextMonth,
                } as any)}
              />
            ) : null}
            {!isMobileScroll.value ? (
              <>
                {desktopGaps.value.map((gap, index) => (
                  <div key={index} class="v-advanced-date-picker__gap">
                    {gap.label}
                  </div>
                ))}
                {renderSearch(-1)}
                {renderSearch(1)}
              </>
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
      </VCard>
    )
  },
})
