import type { PropType } from 'vue'
import { computed, defineComponent, nextTick, ref, toRef } from 'vue'

import { VDivider, VSheet } from 'vuetify/components'
import { useDate, useDisplay } from 'vuetify'

import { useAdvancedDateGrid } from '@/composables/useAdvancedDateGrid'
import { useAdvancedDateModel } from '@/composables/useAdvancedDateModel'
import { useAdvancedDateNavigation } from '@/composables/useAdvancedDateNavigation'
import { usePresetRanges } from '@/composables/usePresetRanges'
import { useRovingFocus } from '@/composables/useRovingFocus'
import { useTouchSwipe } from '@/composables/useTouchSwipe'
import type {
  AdvancedDateAdapter,
  AdvancedDateModel,
  PresetRange,
} from '@/types'
import { dateKey } from '@/util/dates'
import { serializeModel } from '@/util/model'

import '@/styles/VAdvancedDatePicker.sass'

import { VAdvancedDateActions } from './VAdvancedDateActions'
import { VAdvancedDateMonth } from './VAdvancedDateMonth'
import { VAdvancedDatePresets } from './VAdvancedDatePresets'

function clampMonthCount(value: number): number {
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1
}

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
    showWeekNumbers: Boolean,
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
    const containerRef = ref<HTMLElement | null>(null)
    const now = adapter.startOfDay(adapter.date() as unknown)

    const monthRef = computed(() => props.month ?? adapter.getMonth(now))
    const yearRef = computed(() => props.year ?? adapter.getYear(now))
    const monthsRef = computed(() => clampMonthCount(props.months))
    const disabledRef = computed(() => props.disabled || props.readonly)

    const model = useAdvancedDateModel({
      adapter,
      modelValue: toRef(props, 'modelValue'),
      range: toRef(props, 'range'),
      returnObject: toRef(props, 'returnObject'),
      autoApply: toRef(props, 'autoApply'),
      min: toRef(props, 'min'),
      max: toRef(props, 'max'),
      allowedDates: toRef(props, 'allowedDates'),
      onUpdate: (value) => emit('update:modelValue', value),
      onCancel: () => emit('cancel'),
    })

    const navigation = useAdvancedDateNavigation({
      adapter,
      modelValue: toRef(props, 'modelValue'),
      range: toRef(props, 'range'),
      months: monthsRef,
      month: monthRef,
      year: yearRef,
      min: toRef(props, 'min'),
      max: toRef(props, 'max'),
      onMonthChange: (value) => emit('update:month', value),
      onYearChange: (value) => emit('update:year', value),
    })

    const grid = useAdvancedDateGrid({
      adapter,
      visibleMonths: navigation.visibleMonths,
      selection: model.normalized,
      hoveredDate: model.hoveredDate,
      range: toRef(props, 'range'),
      showWeekNumbers: toRef(props, 'showWeekNumbers'),
      min: toRef(props, 'min'),
      max: toRef(props, 'max'),
      allowedDates: toRef(props, 'allowedDates'),
    })

    const presetRanges = usePresetRanges({
      adapter,
      presets: toRef(props, 'presets'),
      range: toRef(props, 'range'),
      selection: model.normalized,
    })

    const dayLookup = computed(() => {
      return new Map(
        grid.months.value.flatMap((month) =>
          month.weeks.flatMap((week) =>
            week.days.map((day) => [day.key, day.date] as const),
          ),
        ),
      )
    })

    function findFocusableButton(
      targetKey: string,
      direction: 1 | -1,
    ): HTMLButtonElement | null {
      const buttons = Array.from(
        containerRef.value?.querySelectorAll<HTMLButtonElement>(
          'button[data-date]',
        ) ?? [],
      )
      const index = buttons.findIndex(
        (button) => button.dataset.date === targetKey,
      )

      if (index === -1) return null
      if (!buttons[index].disabled) return buttons[index]

      for (
        let cursor = index + direction;
        buttons[cursor];
        cursor += direction
      ) {
        if (!buttons[cursor].disabled) return buttons[cursor]
      }

      return null
    }

    async function focusDate(date: unknown) {
      const targetMonth = adapter.startOfMonth(date)
      const visible = navigation.visibleMonths.value.some((month) =>
        adapter.isSameMonth(month, targetMonth),
      )

      if (!visible) navigation.setDisplayedMonth(targetMonth)

      await nextTick()
      const selector = `[data-date="${dateKey(adapter, date)}"]`
      const referenceDate =
        focus.activeDate.value ?? model.normalized.value.start ?? date
      const direction = adapter.isBefore(date, referenceDate) ? -1 : 1
      const direct =
        containerRef.value?.querySelector<HTMLButtonElement>(selector) ?? null
      const button = direct?.disabled
        ? findFocusableButton(dateKey(adapter, date), direction)
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
        grid.months.value[0]?.weeks
          .flatMap((week) => week.days)
          .find((day) => !day.disabled)?.date

      if (!fallback) return

      void focusDate(fallback)
    }

    const focus = useRovingFocus({
      adapter,
      onFocusDate: focusDate,
      onSelect: (date) => model.selectDate(date),
      onEscape: () => emit('cancel'),
    })

    const activeDateKey = computed(() => {
      if (focus.activeDate.value)
        return dateKey(adapter, focus.activeDate.value)
      if (model.normalized.value.start)
        return dateKey(adapter, model.normalized.value.start)
      const firstDay = grid.months.value[0]?.weeks
        .flatMap((week) => week.days)
        .find((day) => !day.outside && !day.disabled)
      return firstDay?.key ?? ''
    })

    const swipe = useTouchSwipe({
      disabled: () => !props.swipeable || !display.mobile.value,
      onPrevious: navigation.prevMonth,
      onNext: navigation.nextMonth,
    })

    const liveText = computed(() => {
      const labels = grid.months.value.map((month) => month.label).join(', ')

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
      model.apply()
      emit(
        'apply',
        serializeModel(model.normalized.value, {
          range: props.range,
          returnObject: props.returnObject,
        }),
      )
    }

    function handlePresetSelect(preset: PresetRange<unknown>) {
      model.selectPreset(preset)
      emit('presetSelect', preset)
    }

    expose({
      focusDate,
      focusActiveDate,
      prevMonth: navigation.prevMonth,
      nextMonth: navigation.nextMonth,
    })

    return () => (
      <VSheet
        class={[
          'v-advanced-date-picker',
          `v-advanced-date-picker--density-${props.density}`,
          {
            'v-advanced-date-picker--stacked': display.mobile.value,
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
                onSelect={handlePresetSelect}
                v-slots={slots}
              />
              <VDivider vertical={!display.mobile.value} />
            </>
          ) : null}

          <div
            ref={containerRef}
            class="v-advanced-date-picker__months"
            style={{ touchAction: 'pan-y' }}
            onMouseleave={() => model.setHoverDate(null)}
            {...swipe.touchHandlers}
          >
            {grid.months.value.map((month, index) => (
              <VAdvancedDateMonth
                key={month.key}
                month={month}
                activeDateKey={activeDateKey.value}
                showWeekNumbers={props.showWeekNumbers}
                showPrevious={index === 0}
                showNext={index === grid.months.value.length - 1}
                canPrevious={navigation.canPrev.value}
                canNext={navigation.canNext.value}
                disabled={props.disabled}
                onPrevious={navigation.prevMonth}
                onNext={navigation.nextMonth}
                onSelect={model.selectDate}
                onHover={model.setHoverDate}
                onFocusDate={focus.setActiveDate}
                onKeydown={focus.onKeydown}
                v-slots={slots}
              />
            ))}
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
