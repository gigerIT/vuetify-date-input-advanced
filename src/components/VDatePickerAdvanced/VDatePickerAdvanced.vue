<script setup lang="ts">
import { computed, ref, toRef, type PropType } from 'vue'
import { useDate } from 'vuetify'
import {
  getRangeBoundaryPayload,
  useHoverPreview,
  useMultiMonth,
  usePresets,
  useSwipe,
} from '@/composables'
import { buildDateRange } from '@/utils/dateHelpers'
import type { PresetRange, ResolvedPresetRange } from '@/types'
import { VDateInputAdvancedHeader } from '@/components/VDateInputAdvancedHeader'
import { VDateInputAdvancedPresets } from '@/components/VDateInputAdvancedPresets'

type DisplayBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'

const props = defineProps({
  modelValue: {
    type: [Array, Object, String, Number, Date, Boolean] as PropType<unknown | unknown[] | null>,
    default: null,
  },
  range: {
    type: Boolean,
    default: true,
  },
  months: {
    type: Number,
    default: 2,
  },
  presets: {
    type: Array as PropType<PresetRange[]>,
    default: undefined,
  },
  showPresets: {
    type: Boolean,
    default: true,
  },
  autoApply: {
    type: Boolean,
    default: true,
  },
  swipeable: {
    type: Boolean,
    default: true,
  },
  fullscreen: {
    type: Boolean,
    default: false,
  },
  hideYearMenu: {
    type: Boolean,
    default: false,
  },
  min: {
    type: null as unknown as PropType<unknown>,
    default: undefined,
  },
  max: {
    type: null as unknown as PropType<unknown>,
    default: undefined,
  },
  allowedDates: {
    type: [Array, Function] as PropType<unknown[] | ((date: unknown) => boolean)>,
    default: undefined,
  },
  allowedMonths: {
    type: [Array, Function] as PropType<number[] | ((month: number) => boolean)>,
    default: undefined,
  },
  allowedYears: {
    type: [Array, Function] as PropType<number[] | ((year: number) => boolean)>,
    default: undefined,
  },
  showWeek: {
    type: Boolean,
    default: false,
  },
  weeksInMonth: {
    type: String as PropType<'static' | 'dynamic'>,
    default: 'static',
  },
  firstDayOfWeek: {
    type: [String, Number] as PropType<string | number>,
    default: undefined,
  },
  events: {
    type: [Array, Function, Object] as PropType<
      string[] | Record<string, string | boolean | string[]> | ((date: string) => string | boolean | string[])
    >,
    default: undefined,
  },
  eventColor: {
    type: [String, Function, Object, Array, Boolean] as PropType<
      string | boolean | string[] | Record<string, string | boolean | string[]> | ((date: string) => string | boolean | string[])
    >,
    default: undefined,
  },
  showAdjacentMonths: {
    type: Boolean,
    default: true,
  },
  controlVariant: {
    type: String as PropType<'docked' | 'modal'>,
    default: 'modal',
  },
  viewMode: {
    type: String as PropType<'month' | 'months' | 'year'>,
    default: 'month',
  },
  color: {
    type: String,
    default: undefined,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  mobileBreakpoint: {
    type: [Number, String] as PropType<number | DisplayBreakpoint>,
    default: undefined,
  },
  weekdays: {
    type: Array as PropType<Array<0 | 1 | 2 | 3 | 4 | 5 | 6>>,
    default: undefined,
  },
  firstDayOfYear: {
    type: [String, Number] as PropType<string | number>,
    default: undefined,
  },
  weekdayFormat: {
    type: String as PropType<'long' | 'short' | 'narrow'>,
    default: undefined,
  },
  hideWeekdays: {
    type: Boolean,
    default: false,
  },
  transition: {
    type: String,
    default: undefined,
  },
  reverseTransition: {
    type: String,
    default: undefined,
  },
  header: {
    type: String,
    default: undefined,
  },
  title: {
    type: String,
    default: undefined,
  },
  headerColor: {
    type: String,
    default: undefined,
  },
  headerDateFormat: {
    type: String,
    default: undefined,
  },
  landscapeHeaderWidth: {
    type: [String, Number] as PropType<string | number>,
    default: undefined,
  },
  controlHeight: {
    type: [String, Number] as PropType<string | number>,
    default: undefined,
  },
  nextIcon: {
    type: [String, Array, Object] as PropType<unknown>,
    default: undefined,
  },
  prevIcon: {
    type: [String, Array, Object] as PropType<unknown>,
    default: undefined,
  },
  modeIcon: {
    type: [String, Array, Object] as PropType<unknown>,
    default: undefined,
  },
  divided: {
    type: Boolean,
    default: false,
  },
  landscape: {
    type: Boolean,
    default: false,
  },
  hideTitle: {
    type: Boolean,
    default: false,
  },
  pickerProps: {
    type: Object as PropType<Record<string, unknown>>,
    default: undefined,
  },
  cancelText: {
    type: String,
    default: 'Cancel',
  },
  okText: {
    type: String,
    default: 'Apply',
  },
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: unknown | unknown[] | null): void
  (e: 'range-start', value: unknown): void
  (e: 'range-end', value: unknown): void
  (e: 'month-change', value: { month: number; year: number }): void
  (e: 'preset-select', value: ResolvedPresetRange): void
  (e: 'apply'): void
  (e: 'cancel'): void
}>()

const adapter = useDate()

const modelRef = toRef(props, 'modelValue')
const rangeRef = toRef(props, 'range')

const {
  monthViews,
  canGoPrev,
  canGoNext,
  previous,
  next,
  mobile,
} = useMultiMonth({
  months: toRef(props, 'months'),
  modelValue: modelRef,
  min: toRef(props, 'min'),
  max: toRef(props, 'max'),
  mobileBreakpoint: toRef(props, 'mobileBreakpoint'),
})

const { resolvedPresets, activePresetIndex } = usePresets(adapter, toRef(props, 'presets'), modelRef)

const {
  setHoveredDate,
  clearHoveredDate,
  isPreviewDate,
  isPreviewStart,
  isPreviewEnd,
} = useHoverPreview(modelRef, rangeRef)

const swipeTarget = ref<HTMLElement | null>(null)
useSwipe(swipeTarget, {
  enabled: computed(() => props.swipeable && mobile.value),
  onPrev: () => onPrev(),
  onNext: () => onNext(),
})

const headerMonths = computed(() => {
  return monthViews.value.map((month) => ({
    month: month.month,
    year: month.year,
    label: adapter.format(month.date, 'monthAndYear'),
  }))
})

const pickerMultiple = computed(() => (props.range ? 'range' : false))

function emitMonthChange() {
  const first = monthViews.value[0]
  if (!first) return
  emit('month-change', { month: first.month, year: first.year })
}

function onPrev() {
  previous()
  emitMonthChange()
}

function onNext() {
  next()
  emitMonthChange()
}

function onSelectPreset(preset: ResolvedPresetRange) {
  const [start, end] = preset.value
  const value = props.range ? buildDateRange(adapter, start, end) : start
  emit('update:modelValue', value)
  emit('preset-select', preset)
  if (props.autoApply) emit('apply')
}

function onUpdate(value: unknown | unknown[] | null) {
  const previousBoundary = getRangeBoundaryPayload(props.modelValue)
  const nextBoundary = getRangeBoundaryPayload(value)

  emit('update:modelValue', value)

  if (!previousBoundary.start && nextBoundary.start) {
    emit('range-start', nextBoundary.start)
  }

  if (
    nextBoundary.end &&
    (!previousBoundary.end || !adapter.isSameDay(previousBoundary.end, nextBoundary.end))
  ) {
    emit('range-end', nextBoundary.end)
  }

  if (props.autoApply) {
    const done = props.range ? nextBoundary.count > 1 : nextBoundary.count > 0
    if (done) emit('apply')
  }
}

function dayClass(item: { date: unknown }) {
  return {
    'v-date-input-advanced-picker__day--preview': isPreviewDate(item.date),
    'v-date-input-advanced-picker__day--preview-start': isPreviewStart(item.date),
    'v-date-input-advanced-picker__day--preview-end': isPreviewEnd(item.date),
  }
}

function eventColorsFor(dateIso: string): string[] {
  if (!props.events) return []

  let eventData: string | boolean | string[] | undefined = undefined

  if (Array.isArray(props.events)) {
    eventData = props.events.includes(dateIso)
  } else if (typeof props.events === 'function') {
    eventData = props.events(dateIso)
  } else {
    eventData = props.events[dateIso]
  }

  if (!eventData) return []

  if (eventData !== true) {
    return Array.isArray(eventData) ? eventData : [eventData]
  }

  if (typeof props.eventColor === 'string') return [props.eventColor]
  if (Array.isArray(props.eventColor)) return props.eventColor
  if (typeof props.eventColor === 'function') {
    const resolved = props.eventColor(dateIso)
    if (resolved === true) return ['surface-variant']
    if (!resolved) return []
    return Array.isArray(resolved) ? resolved : [resolved]
  }
  if (props.eventColor && typeof props.eventColor === 'object') {
    const resolved = props.eventColor[dateIso]
    if (resolved === true) return ['surface-variant']
    if (!resolved) return []
    return Array.isArray(resolved) ? resolved : [resolved]
  }

  return ['surface-variant']
}
</script>

<template>
  <div
    class="v-date-input-advanced-picker"
    :class="{ 'v-date-input-advanced-picker--fullscreen': fullscreen }"
  >
    <slot name="header" :months="headerMonths" :prev="onPrev" :next="onNext">
      <VDateInputAdvancedHeader
        :months="headerMonths"
        :can-go-prev="canGoPrev"
        :can-go-next="canGoNext"
        @prev="onPrev"
        @next="onNext"
      />
    </slot>

    <div class="v-date-input-advanced-picker__layout">
      <VDateInputAdvancedPresets
        v-if="showPresets"
        :presets="resolvedPresets"
        :active-index="activePresetIndex"
        :mobile="mobile"
        @select="onSelectPreset"
      >
        <template #preset="slotProps">
          <slot name="preset" v-bind="slotProps">
            {{ slotProps.preset.label }}
          </slot>
        </template>
      </VDateInputAdvancedPresets>

      <div ref="swipeTarget" class="v-date-input-advanced-picker__months" style="touch-action: pan-y">
        <div
          v-for="month in monthViews"
          :key="month.key"
          class="v-date-input-advanced-picker__month"
        >
          <VDatePicker
            :model-value="modelValue"
            :multiple="pickerMultiple"
            :hide-header="true"
            :weeks-in-month="weeksInMonth"
            :show-week="showWeek"
            :month="month.month"
            :year="month.year"
            :allowed-dates="allowedDates"
            :allowed-months="allowedMonths"
            :allowed-years="allowedYears"
              :show-adjacent-months="showAdjacentMonths"
              :weekdays="weekdays"
              :first-day-of-year="firstDayOfYear"
              :weekday-format="weekdayFormat"
              :hide-weekdays="hideWeekdays"
              :transition="transition"
              :reverse-transition="reverseTransition"
              :header="header"
              :title="title"
              :header-color="headerColor"
              :header-date-format="headerDateFormat"
              :landscape-header-width="landscapeHeaderWidth"
              :control-height="controlHeight"
              :next-icon="nextIcon"
              :prev-icon="prevIcon"
              :mode-icon="modeIcon"
              :divided="divided"
              :landscape="landscape"
              :hide-title="hideTitle"
              :control-variant="controlVariant"
              :no-month-picker="hideYearMenu"
              :first-day-of-week="firstDayOfWeek"
            :events="events"
            :event-color="eventColor"
            :view-mode="viewMode"
            :min="min"
            :max="max"
            :color="color"
              :disabled="disabled"
              :readonly="readonly"
              v-bind="pickerProps"
              @update:model-value="onUpdate"
            >
            <template #day="slotProps">
              <slot name="day" v-bind="slotProps">
                <VBtn
                  v-bind="slotProps.props"
                  :class="dayClass(slotProps.item)"
                  @mouseenter="setHoveredDate(slotProps.item.date)"
                  @mouseleave="clearHoveredDate"
                >
                  {{ slotProps.item.localized }}
                  <span
                    v-if="eventColorsFor(slotProps.item.isoDate).length"
                    class="v-date-input-advanced-picker__events"
                  >
                    <span
                      v-for="eventColorValue in eventColorsFor(slotProps.item.isoDate)"
                      :key="eventColorValue"
                      class="v-date-input-advanced-picker__event-dot"
                      :style="{ backgroundColor: `rgb(var(--v-theme-${eventColorValue}))` }"
                    />
                  </span>
                </VBtn>
              </slot>
            </template>
          </VDatePicker>
        </div>
      </div>
    </div>

    <div v-if="!autoApply" class="v-date-input-advanced-picker__actions">
      <slot name="actions" :save="() => emit('apply')" :cancel="() => emit('cancel')" :is-pristine="false">
        <VBtn variant="text" @click="emit('cancel')">{{ cancelText }}</VBtn>
        <VBtn color="primary" variant="flat" @click="emit('apply')">{{ okText }}</VBtn>
      </slot>
    </div>
  </div>
</template>

<style lang="scss">
@layer vuetify-date-input-advanced {
  .v-date-input-advanced-picker {
    display: grid;
    gap: 12px;
    inline-size: min(100%, 920px);
  }

  .v-date-input-advanced-picker__layout {
    align-items: start;
    display: grid;
    gap: var(--v-date-input-advanced-month-gap, 16px);
    grid-template-columns: auto 1fr;
  }

  .v-date-input-advanced-picker__months {
    display: grid;
    gap: var(--v-date-input-advanced-month-gap, 16px);
    grid-auto-flow: column;
    grid-auto-columns: minmax(250px, 1fr);
    overflow: auto;
  }

  .v-date-input-advanced-picker__month {
    min-inline-size: 0;
  }

  .v-date-input-advanced-picker__day--preview {
    background: var(--v-date-input-advanced-range-hover-bg);
  }

  .v-date-input-advanced-picker__day--preview-start,
  .v-date-input-advanced-picker__day--preview-end {
    outline: 1px solid currentcolor;
  }

  .v-date-input-advanced-picker__actions {
    display: flex;
    gap: 8px;
    justify-content: end;
  }

  .v-date-input-advanced-picker__events {
    bottom: 2px;
    display: inline-flex;
    gap: 2px;
    inset-inline-end: 2px;
    position: absolute;
  }

  .v-date-input-advanced-picker__event-dot {
    block-size: 4px;
    border-radius: 999px;
    inline-size: 4px;
  }

  .v-date-input-advanced-picker--fullscreen {
    block-size: 100%;
    grid-template-rows: auto 1fr auto;
    inline-size: 100%;
    padding: 12px;
  }

  @media (width <= 839px) {
    .v-date-input-advanced-picker__layout {
      grid-template-columns: 1fr;
    }

    .v-date-input-advanced-picker__months {
      grid-auto-flow: row;
    }
  }
}
</style>
