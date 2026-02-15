<template>
  <div
    ref="pickerEl"
    class="v-advanced-date-picker"
    :class="{
      'v-advanced-date-picker--fullscreen': isFullscreen,
      'v-advanced-date-picker--mobile': isMobile,
      'v-advanced-date-picker--with-presets': showPresets,
      'v-advanced-date-picker--swiping': swiping,
    }"
  >
    <!-- Fullscreen top bar -->
    <div v-if="isFullscreen" class="v-advanced-date-picker__topbar">
      <button
        class="v-advanced-date-picker__topbar-close"
        aria-label="Close"
        @click="$emit('close')"
      >
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor" />
        </svg>
      </button>
      <span class="v-advanced-date-picker__topbar-title">{{ title }}</span>
      <button
        v-if="!autoApply"
        class="v-advanced-date-picker__topbar-apply"
        :disabled="!hasCompleteSelection"
        @click="$emit('apply')"
      >
        Apply
      </button>
      <div v-else class="v-advanced-date-picker__topbar-spacer" />
    </div>

    <!-- Preset chips (horizontal, mobile fullscreen) -->
    <VAdvancedDatePresets
      v-if="showPresets && isFullscreen"
      :presets="effectivePresets"
      :active-index="activePresetIndex"
      horizontal
      @select="onPresetSelect"
    />

    <div class="v-advanced-date-picker__body">
      <!-- Preset sidebar (vertical, desktop) -->
      <VAdvancedDatePresets
        v-if="showPresets && !isFullscreen"
        :presets="effectivePresets"
        :active-index="activePresetIndex"
        @select="onPresetSelect"
      />

      <!-- Calendar area -->
      <div
        ref="calendarEl"
        class="v-advanced-date-picker__calendar"
        :style="calendarTransformStyle"
      >
        <div
          v-for="(m, idx) in visibleMonths"
          :key="m.key"
          class="v-advanced-date-picker__month-panel"
        >
          <VAdvancedDateHeader
            :year="m.year"
            :month="m.month"
            :show-prev="idx === 0"
            :show-next="idx === visibleMonths.length - 1"
            :can-go-back="canGoBack"
            :can-go-forward="canGoForward"
            :hide-year-menu="hideYearMenu"
            @prev="goBack()"
            @next="goForward()"
            @year-click="$emit('year-click', m)"
          />
          <VAdvancedDateMonth
            :year="m.year"
            :month="m.month"
            :start-date="startDate"
            :end-date="endDate"
            :hover-date="hoverDate"
            :phase="phase"
            :first-day-of-week="firstDayOfWeek"
            :show-week-numbers="showWeekNumbers"
            :mobile="isMobile"
            :min="minDate"
            :max="maxDate"
            :allowed-dates="allowedDates"
            :color="color"
            :focused-date="focusedDate"
            @day-click="onDayClick"
            @day-hover="onDayHover"
            @keydown="onDayKeydown"
          />
        </div>
      </div>
    </div>

    <!-- Bottom display bar (date summary + action buttons) -->
    <div
      v-if="showBottomBar"
      class="v-advanced-date-picker__bottom"
      :class="{ 'v-advanced-date-picker__bottom--sticky': isFullscreen }"
    >
      <span v-if="displayText" class="v-advanced-date-picker__summary">
        {{ displayText }}
      </span>
      <div v-if="!autoApply" class="v-advanced-date-picker__actions">
        <slot name="actions" :apply="() => $emit('apply')" :cancel="() => $emit('cancel')">
          <button
            class="v-advanced-date-picker__action v-advanced-date-picker__action--cancel"
            @click="$emit('cancel')"
          >
            Cancel
          </button>
          <button
            class="v-advanced-date-picker__action v-advanced-date-picker__action--apply"
            :disabled="!hasCompleteSelection"
            @click="$emit('apply')"
          >
            Apply
          </button>
        </slot>
      </div>
    </div>

    <!-- Screen reader live region -->
    <div class="v-advanced-date-picker__sr-live" aria-live="polite" aria-atomic="true">
      {{ liveAnnouncement }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, toRef, onMounted, nextTick } from 'vue'
import type { PresetRange, SelectionPhase } from '../../types'
import type { MonthDescriptor } from '../../composables/useMultiMonth'
import { VAdvancedDateMonth } from '../VAdvancedDateMonth'
import { VAdvancedDateHeader } from '../VAdvancedDateHeader'
import { VAdvancedDatePresets } from '../VAdvancedDatePresets'
import { useMultiMonth } from '../../composables/useMultiMonth'
import { usePresets } from '../../composables/usePresets'
import { useSwipe } from '../../composables/useSwipe'
import { addMonths, isSameDay, formatDate } from '../../utils/dateHelpers'

const props = withDefaults(defineProps<{
  startDate?: Date | null
  endDate?: Date | null
  hoverDate?: Date | null
  phase?: SelectionPhase
  months?: number
  showPresets?: boolean
  presets?: PresetRange[]
  autoApply?: boolean
  hideYearMenu?: boolean
  firstDayOfWeek?: number
  showWeekNumbers?: boolean
  swipeable?: boolean
  isFullscreen?: boolean
  isMobile?: boolean
  maxMonthsForBreakpoint?: number
  min?: Date | string
  max?: Date | string
  allowedDates?: (date: Date) => boolean
  color?: string
  title?: string
}>(), {
  startDate: null,
  endDate: null,
  hoverDate: null,
  phase: 'idle',
  months: 2,
  showPresets: true,
  presets: undefined,
  autoApply: true,
  hideYearMenu: false,
  firstDayOfWeek: 1,
  showWeekNumbers: false,
  swipeable: true,
  isFullscreen: false,
  isMobile: false,
  maxMonthsForBreakpoint: 12,
  min: undefined,
  max: undefined,
  allowedDates: undefined,
  color: 'primary',
  title: 'Select date range',
})

const emit = defineEmits<{
  'day-click': [date: Date]
  'day-hover': [date: Date | null]
  'preset-select': [preset: PresetRange]
  'apply': []
  'cancel': []
  'close': []
  'month-change': [payload: { year: number, month: number }]
  'year-click': [month: MonthDescriptor]
}>()

const pickerEl = ref<HTMLElement | null>(null)
const calendarEl = ref<HTMLElement | null>(null)
const focusedDate = ref<Date | null>(null)
const liveAnnouncement = ref('')

const minDate = computed(() => {
  if (!props.min) return undefined
  return props.min instanceof Date ? props.min : new Date(props.min)
})

const maxDate = computed(() => {
  if (!props.max) return undefined
  return props.max instanceof Date ? props.max : new Date(props.max)
})

// Multi-month navigation
const multiMonth = useMultiMonth({
  months: toRef(props, 'months'),
  initialDate: props.startDate ?? new Date(),
  min: toRef(props, 'min') as any,
  max: toRef(props, 'max') as any,
})

// Clamp months based on breakpoint
watch(
  () => props.maxMonthsForBreakpoint,
  (maxForBp) => {
    multiMonth.setEffectiveMonths(Math.min(props.months, maxForBp))
  },
  { immediate: true },
)

const { visibleMonths, canGoBack, canGoForward, goBack, goForward } = multiMonth

// Watch for month changes to announce
watch(
  () => visibleMonths.value[0],
  (first) => {
    if (first) {
      const MONTH_NAMES = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
      ]
      liveAnnouncement.value = `${MONTH_NAMES[first.month]} ${first.year}`
      emit('month-change', { year: first.year, month: first.month })
    }
  },
)

// Presets
const { effectivePresets, activePresetIndex, resolvePreset } = usePresets({
  presets: toRef(props, 'presets'),
  startDate: toRef(props, 'startDate') as any,
  endDate: toRef(props, 'endDate') as any,
})

// Swipe
const swiping = ref(false)
const { swipeOffset, isSwiping } = useSwipe({
  el: calendarEl,
  enabled: toRef(props, 'swipeable'),
  onSwipeLeft(momentum) {
    goForward(momentum ? 2 : 1)
  },
  onSwipeRight(momentum) {
    goBack(momentum ? 2 : 1)
  },
})

watch(isSwiping, (v) => {
  swiping.value = v
})

const calendarTransformStyle = computed(() => {
  if (!isSwiping.value || swipeOffset.value === 0) return {}
  // Rubber-band effect: dampen the offset
  const damped = swipeOffset.value * 0.4
  return {
    transform: `translateX(${damped}px)`,
    transition: 'none',
  }
})

// Display text
const displayText = computed(() => {
  if (props.startDate && props.endDate) {
    return `${formatDate(props.startDate)} – ${formatDate(props.endDate)}`
  }
  if (props.startDate) {
    return formatDate(props.startDate)
  }
  return ''
})

const hasCompleteSelection = computed(() => {
  return !!(props.startDate && (props.endDate || props.phase === 'complete'))
})

const showBottomBar = computed(() => {
  return !props.autoApply || displayText.value
})

// Event handlers
function onDayClick(date: Date) {
  emit('day-click', date)
  focusedDate.value = date
}

function onDayHover(date: Date | null) {
  emit('day-hover', date)
}

function onPresetSelect(preset: PresetRange) {
  emit('preset-select', preset)
  // Center on the preset start date
  const [start] = resolvePreset(preset)
  multiMonth.centerOn(start)
}

function onDayKeydown(event: KeyboardEvent, date: Date) {
  let newDate: Date | null = null

  switch (event.key) {
    case 'ArrowLeft':
      newDate = new Date(date)
      newDate.setDate(date.getDate() - 1)
      event.preventDefault()
      break
    case 'ArrowRight':
      newDate = new Date(date)
      newDate.setDate(date.getDate() + 1)
      event.preventDefault()
      break
    case 'ArrowUp':
      newDate = new Date(date)
      newDate.setDate(date.getDate() - 7)
      event.preventDefault()
      break
    case 'ArrowDown':
      newDate = new Date(date)
      newDate.setDate(date.getDate() + 7)
      event.preventDefault()
      break
    case 'Enter':
    case ' ':
      emit('day-click', date)
      event.preventDefault()
      return
    case 'Escape':
      emit('close')
      event.preventDefault()
      return
  }

  if (newDate) {
    focusedDate.value = newDate
    // Ensure the new date's month is visible
    const newMonth = newDate.getMonth()
    const newYear = newDate.getFullYear()
    const isVisible = visibleMonths.value.some(
      (m) => m.year === newYear && m.month === newMonth,
    )
    if (!isVisible) {
      if (newDate.getTime() < date.getTime()) {
        goBack()
      } else {
        goForward()
      }
    }
    // Focus the new day cell after DOM update
    nextTick(() => {
      const dayEl = pickerEl.value?.querySelector(
        `[tabindex="0"].v-advanced-date-month__day`,
      ) as HTMLElement
      dayEl?.focus()
    })
  }
}

// Center on start date when it changes
watch(
  () => props.startDate,
  (sd) => {
    if (sd) {
      multiMonth.centerOn(sd)
    }
  },
)

// Focus management: focus first selectable day on mount
onMounted(() => {
  nextTick(() => {
    const firstDay = pickerEl.value?.querySelector(
      '.v-advanced-date-month__day[tabindex="0"]',
    ) as HTMLElement
    firstDay?.focus()
  })
})
</script>
