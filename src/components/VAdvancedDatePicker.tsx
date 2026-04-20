import {
  Transition,
  computed,
  defineComponent,
  nextTick,
  ref,
  toRef,
  watch,
} from 'vue'

import { VBtn, VDivider, VSheet } from 'vuetify/components'
import { useDate, useDisplay } from 'vuetify'

import { useAdvancedDateGrid } from '@/composables/useAdvancedDateGrid'
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
      selection: model.normalized,
      selectionChangeOrigin,
      range: toRef(props, 'range'),
      months: navigationMonthsRef,
      month: monthRef,
      year: yearRef,
      min: toRef(props, 'min'),
      max: toRef(props, 'max'),
      allowedDates: toRef(props, 'allowedDates'),
      allowedStartDates: toRef(props, 'allowedStartDates'),
      allowedEndDates: toRef(props, 'allowedEndDates'),
      onMonthChange: (value) => emit('update:month', value),
      onYearChange: (value) => emit('update:year', value),
    })
    const mobileWindow = useAdvancedDatePickerMobileWindow({
      adapter,
      desktopVisibleMonths: navigation.visibleMonths,
      displayedMonth: navigation.displayedMonth,
      setDisplayedMonth: navigation.setDisplayedMonth,
      selectionChangeOrigin,
      isMobileScroll,
      isMobileFullscreen,
      months: monthsRef,
      selection: model.normalized,
      range: toRef(props, 'range'),
      min: toRef(props, 'min'),
      max: toRef(props, 'max'),
      allowedDates: toRef(props, 'allowedDates'),
      allowedStartDates: toRef(props, 'allowedStartDates'),
      allowedEndDates: toRef(props, 'allowedEndDates'),
    })

    const isReverse = ref(false)

    watch(navigation.displayedMonth, (value, oldValue) => {
      if (!oldValue) return

      isReverse.value = adapter.isBefore(value, oldValue)
    })

    const grid = useAdvancedDateGrid({
      adapter,
      visibleMonths: mobileWindow.visibleMonths,
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

    const monthTransition = computed(() =>
      isReverse.value
        ? 'v-advanced-date-picker__calendar-slide-reverse'
        : 'v-advanced-date-picker__calendar-slide',
    )
    const monthsStyle = computed<Record<string, string>>(() => ({
      ...mobileWindow.monthsStyle.value,
      // Slide by one rendered month plus the shared gap so adjacent months
      // feel anchored during horizontal navigation.
      '--v-advanced-date-visible-month-count': String(monthsRef.value),
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

    const focus = useAdvancedDatePickerFocus({
      adapter,
      months: grid.months,
      selection: model.normalized,
      firstDayOfWeek: toRef(props, 'firstDayOfWeek'),
      containerRef: mobileWindow.containerRef,
      monthsTrackRef: mobileWindow.monthsTrackRef,
      ensureDateVisible,
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
        props.onDraftChange?.(value as NormalizedRange<unknown>)

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

    function handlePresetSelect(preset: PresetRange<unknown>) {
      if (disabledRef.value) return

      markInternalSelectionChange()
      if (!model.selectPreset(preset)) {
        localSelectionChangeOrigin.value = null
        return
      }
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

      mobileWindow.resetWindow(targetMonth)
      navigation.setDisplayedMonth(targetMonth)

      await nextTick()
      mobileWindow.scrollMonthIntoView(targetMonth)
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
      >
        <div
          class="v-advanced-date-picker__live"
          aria-live="polite"
          aria-atomic="true"
        >
          {liveText.value}
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
                  disabled: !navigation.canPrev.value || props.disabled,
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
                  disabled: !navigation.canNext.value || props.disabled,
                  'aria-label': tDateInputAdvanced('ariaLabel.nextMonth'),
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
