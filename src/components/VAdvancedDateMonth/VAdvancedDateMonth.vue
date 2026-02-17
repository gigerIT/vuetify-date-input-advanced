<template>
  <div
    class="v-advanced-date-month"
    :class="{
      'v-advanced-date-month--mobile': mobile,
      'v-advanced-date-month--with-week-numbers': showWeekNumbers,
    }"
    role="grid"
    :aria-label="`${monthName} ${year}`"
  >
    <!-- Weekday headers -->
    <div class="v-advanced-date-month__weekdays" role="row">
      <div
        v-if="showWeekNumbers"
        class="v-advanced-date-month__week-number v-advanced-date-month__week-header"
        role="columnheader"
      >
        #
      </div>
      <div
        v-for="day in weekdayLabels"
        :key="day"
        class="v-advanced-date-month__weekday text-caption text-medium-emphasis"
        role="columnheader"
        :abbr="day"
      >
        {{ day }}
      </div>
    </div>

    <!-- Calendar grid -->
    <div
      v-for="(week, weekIdx) in weeks"
      :key="weekIdx"
      class="v-advanced-date-month__week"
      role="row"
    >
      <div
        v-if="showWeekNumbers"
        class="v-advanced-date-month__week-number text-caption text-disabled"
        role="rowheader"
      >
        {{ getWeekNumber(week[0]) }}
      </div>
      <!-- Range band wrapper around each v-btn -->
      <div
        v-for="(day, dayIdx) in week"
        :key="dayIdx"
        class="v-advanced-date-month__day-wrapper"
        :class="getRangeBandClasses(day)"
      >
        <v-btn
          icon
          :ripple="false"
          :variant="isDaySelected(day) ? 'flat' : isToday(day) && !isDaySelected(day) ? 'outlined' : 'text'"
          :color="isDaySelected(day) || isToday(day) ? color : undefined"
          :disabled="isDayDisabled(day)"
          class="v-advanced-date-month__day-btn"
          :class="{
            'v-advanced-date-month__day-btn--other-month': !isCurrentMonth(day),
          }"
          role="gridcell"
          :aria-selected="isDaySelected(day) || undefined"
          :aria-disabled="isDayDisabled(day) || undefined"
          :aria-current="isToday(day) ? 'date' : undefined"
          :tabindex="isFocusTarget(day) ? 0 : -1"
          @click="onDayClick(day)"
          @mouseenter="onDayMouseEnter(day)"
          @mouseleave="onDayMouseLeave"
          @keydown="onDayKeydown($event, day)"
        >
          {{ day.getDate() }}
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { VBtn } from 'vuetify/components/VBtn'
import { buildMonthGrid, getWeekNumber as getWeekNum, isSameDay, isSameMonth, isInRange } from '../../utils/dateHelpers'

const props = withDefaults(defineProps<{
  year: number
  month: number
  startDate?: Date | null
  endDate?: Date | null
  hoverDate?: Date | null
  phase?: 'idle' | 'start-selected' | 'complete'
  firstDayOfWeek?: number
  showWeekNumbers?: boolean
  mobile?: boolean
  min?: Date
  max?: Date
  allowedDates?: (date: Date) => boolean
  color?: string
  focusedDate?: Date | null
}>(), {
  startDate: null,
  endDate: null,
  hoverDate: null,
  phase: 'idle',
  firstDayOfWeek: 1,
  showWeekNumbers: false,
  mobile: false,
  min: undefined,
  max: undefined,
  allowedDates: undefined,
  color: 'primary',
  focusedDate: null,
})

const emit = defineEmits<{
  'day-click': [date: Date]
  'day-hover': [date: Date | null]
  'day-focus': [date: Date]
  'keydown': [event: KeyboardEvent, date: Date]
}>()

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const monthName = computed(() => MONTH_NAMES[props.month])

const weekdayLabels = computed(() => {
  const labels: string[] = []
  for (let i = 0; i < 7; i++) {
    labels.push(WEEKDAYS[(i + props.firstDayOfWeek) % 7])
  }
  return labels
})

const grid = computed(() => buildMonthGrid(props.year, props.month, props.firstDayOfWeek))

const weeks = computed(() => {
  const result: Date[][] = []
  for (let i = 0; i < grid.value.length; i += 7) {
    result.push(grid.value.slice(i, i + 7))
  }
  return result
})

function getWeekNumber(date: Date): number {
  return getWeekNum(date)
}

function isCurrentMonth(date: Date): boolean {
  return date.getMonth() === props.month && date.getFullYear() === props.year
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

function isDayDisabled(date: Date): boolean {
  if (props.min && date.getTime() < new Date(props.min.getFullYear(), props.min.getMonth(), props.min.getDate()).getTime()) return true
  if (props.max && date.getTime() > new Date(props.max.getFullYear(), props.max.getMonth(), props.max.getDate(), 23, 59, 59).getTime()) return true
  if (props.allowedDates && !props.allowedDates(date)) return true
  return false
}

function isDaySelected(date: Date): boolean {
  if (props.startDate && isSameDay(date, props.startDate)) return true
  if (props.endDate && isSameDay(date, props.endDate)) return true
  return false
}

function isRangeStart(date: Date): boolean {
  return !!props.startDate && isSameDay(date, props.startDate)
}

function isRangeEnd(date: Date): boolean {
  return !!props.endDate && isSameDay(date, props.endDate)
}

function isInSelectedRange(date: Date): boolean {
  if (!props.startDate || !props.endDate) return false
  return isInRange(date, props.startDate, props.endDate)
}

function isInHoverRange(date: Date): boolean {
  if (props.phase !== 'start-selected') return false
  if (!props.startDate || !props.hoverDate) return false
  return isInRange(date, props.startDate, props.hoverDate)
}

function isHoverRangeStart(date: Date): boolean {
  if (!props.startDate || !props.hoverDate || props.phase !== 'start-selected') return false
  const s = props.startDate.getTime() <= props.hoverDate.getTime() ? props.startDate : props.hoverDate
  return isSameDay(date, s)
}

function isHoverRangeEnd(date: Date): boolean {
  if (!props.startDate || !props.hoverDate || props.phase !== 'start-selected') return false
  const e = props.startDate.getTime() <= props.hoverDate.getTime() ? props.hoverDate : props.startDate
  return isSameDay(date, e)
}

function isFocusTarget(date: Date): boolean {
  if (props.focusedDate) return isSameDay(date, props.focusedDate)
  if (props.startDate && isCurrentMonth(props.startDate)) return isSameDay(date, props.startDate)
  // Default to first day of month
  return date.getDate() === 1 && isCurrentMonth(date)
}

/** Range band classes go on the wrapper div (background band spanning edge-to-edge) */
function getRangeBandClasses(date: Date) {
  const selected = isDaySelected(date)
  const inRange = isInSelectedRange(date)
  const inHover = isInHoverRange(date)

  return {
    'v-advanced-date-month__day-wrapper--range-start': isRangeStart(date),
    'v-advanced-date-month__day-wrapper--range-end': isRangeEnd(date),
    'v-advanced-date-month__day-wrapper--in-range': inRange && !selected,
    'v-advanced-date-month__day-wrapper--hover-range': inHover && !selected && !inRange,
    'v-advanced-date-month__day-wrapper--hover-start': isHoverRangeStart(date),
    'v-advanced-date-month__day-wrapper--hover-end': isHoverRangeEnd(date),
  }
}

function onDayClick(date: Date) {
  if (isDayDisabled(date)) return
  emit('day-click', date)
}

function onDayMouseEnter(date: Date) {
  if (isDayDisabled(date)) return
  emit('day-hover', date)
}

function onDayMouseLeave() {
  emit('day-hover', null)
}

function onDayKeydown(event: KeyboardEvent, date: Date) {
  emit('keydown', event, date)
}
</script>
