<template>
  <div ref="rootEl" class="v-advanced-date-input">
    <!-- Inline mode: no popup, render picker directly -->
    <template v-if="inline">
      <VAdvancedDatePicker
        :start-date="dateState.startDate.value"
        :end-date="dateState.endDate.value"
        :hover-date="hoverState.hoverDate.value"
        :phase="dateState.phase.value"
        :months="months"
        :show-presets="showPresets"
        :presets="presets"
        :auto-apply="autoApply"
        :hide-year-menu="hideYearMenu"
        :first-day-of-week="resolvedFirstDayOfWeek"
        :show-week-numbers="showWeekNumbers"
        :swipeable="swipeable"
        :is-fullscreen="false"
        :is-mobile="fullscreenState.isMobile.value"
        :max-months-for-breakpoint="fullscreenState.maxMonthsForBreakpoint.value"
        :min="min"
        :max="max"
        :allowed-dates="allowedDates"
        :color="color"
        @day-click="onDayClick"
        @day-hover="hoverState.onDayHover"
        @preset-select="onPresetSelect"
        @apply="onApply"
        @cancel="onCancel"
        @month-change="onMonthChange"
      />
    </template>

    <!-- Popup mode -->
    <template v-else>
      <!-- Desktop: VMenu popover -->
      <v-menu
        v-if="!fullscreenState.isFullscreen.value"
        v-model="isOpen"
        :close-on-content-click="false"
        :close-on-back="true"
        location="bottom start"
        :offset="4"
        :min-width="320"
        transition="fade-transition"
        @update:model-value="onMenuToggle"
      >
        <template #activator="{ props: menuProps }">
          <slot name="activator" :props="menuProps" :is-active="isOpen">
            <v-text-field
              v-bind="menuProps"
              :model-value="inputDisplayValue"
              :label="label"
              :variant="variant"
              :density="density"
              :color="color"
              :disabled="disabled"
              :readonly="true"
              append-inner-icon="mdi-calendar"
              class="v-advanced-date-input__field"
            />
          </slot>
        </template>
        <VAdvancedDatePicker
          :start-date="dateState.startDate.value"
          :end-date="dateState.endDate.value"
          :hover-date="hoverState.hoverDate.value"
          :phase="dateState.phase.value"
          :months="months"
          :show-presets="showPresets"
          :presets="presets"
          :auto-apply="autoApply"
          :hide-year-menu="hideYearMenu"
          :first-day-of-week="resolvedFirstDayOfWeek"
          :show-week-numbers="showWeekNumbers"
          :swipeable="swipeable"
          :is-fullscreen="false"
          :is-mobile="false"
          :max-months-for-breakpoint="fullscreenState.maxMonthsForBreakpoint.value"
          :min="min"
          :max="max"
          :allowed-dates="allowedDates"
          :color="color"
          @day-click="onDayClick"
          @day-hover="hoverState.onDayHover"
          @preset-select="onPresetSelect"
          @apply="onApply"
          @cancel="onCancel"
          @close="closePicker"
          @month-change="onMonthChange"
        />
      </v-menu>

      <!-- Mobile: VDialog fullscreen -->
      <template v-else>
        <slot name="activator" :props="{}" :is-active="isOpen">
          <v-text-field
            :model-value="inputDisplayValue"
            :label="label"
            :variant="variant"
            :density="density"
            :color="color"
            :disabled="disabled"
            :readonly="true"
            append-inner-icon="mdi-calendar"
            class="v-advanced-date-input__field"
            @click="openPicker"
            @click:append-inner="openPicker"
            @keydown.enter="openPicker"
            @keydown.space.prevent="openPicker"
          />
        </slot>
        <v-dialog
          v-model="isOpen"
          fullscreen
          :scrim="false"
          transition="dialog-bottom-transition"
        >
          <VAdvancedDatePicker
            :start-date="dateState.startDate.value"
            :end-date="dateState.endDate.value"
            :hover-date="hoverState.hoverDate.value"
            :phase="dateState.phase.value"
            :months="months"
            :show-presets="showPresets"
            :presets="presets"
            :auto-apply="autoApply"
            :hide-year-menu="hideYearMenu"
            :first-day-of-week="resolvedFirstDayOfWeek"
            :show-week-numbers="showWeekNumbers"
            :swipeable="swipeable"
            :is-fullscreen="true"
            :is-mobile="true"
            :max-months-for-breakpoint="1"
            :min="min"
            :max="max"
            :allowed-dates="allowedDates"
            :color="color"
            :title="range ? 'Select date range' : 'Select date'"
            @day-click="onDayClick"
            @day-hover="hoverState.onDayHover"
            @preset-select="onPresetSelect"
            @apply="onApply"
            @cancel="onCancel"
            @close="closePicker"
            @month-change="onMonthChange"
          />
        </v-dialog>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, toRef, nextTick } from 'vue'
import { VTextField } from 'vuetify/components/VTextField'
import { VMenu } from 'vuetify/components/VMenu'
import { VDialog } from 'vuetify/components/VDialog'
import type { DateModelValue, PresetRange, FullscreenMode } from '../../types'
import { VAdvancedDatePicker } from '../VAdvancedDatePicker'
import { useAdvancedDate } from '../../composables/useAdvancedDate'
import { useHoverPreview } from '../../composables/useHoverPreview'
import { useFullscreen } from '../../composables/useFullscreen'
import { formatDate } from '../../utils/dateHelpers'

const props = withDefaults(defineProps<{
  modelValue?: DateModelValue
  range?: boolean
  months?: number
  presets?: PresetRange[]
  showPresets?: boolean
  autoApply?: boolean
  min?: Date | string
  max?: Date | string
  allowedDates?: (date: Date) => boolean
  inline?: boolean
  showWeekNumbers?: boolean
  sixWeeks?: boolean | 'append' | 'prepend'
  swipeable?: boolean
  fullscreen?: FullscreenMode
  hideYearMenu?: boolean
  format?: string
  separator?: string
  firstDayOfWeek?: number
  label?: string
  variant?: 'outlined' | 'filled' | 'underlined' | 'plain' | 'solo' | 'solo-inverted' | 'solo-filled'
  density?: 'default' | 'comfortable' | 'compact'
  color?: string
  disabled?: boolean
  readonly?: boolean
}>(), {
  modelValue: null,
  range: true,
  months: 2,
  presets: undefined,
  showPresets: true,
  autoApply: true,
  min: undefined,
  max: undefined,
  allowedDates: undefined,
  inline: false,
  showWeekNumbers: false,
  sixWeeks: false,
  swipeable: true,
  fullscreen: 'auto',
  hideYearMenu: false,
  format: 'MMM DD, YYYY',
  separator: ' – ',
  firstDayOfWeek: undefined,
  label: undefined,
  variant: 'outlined',
  density: 'default',
  color: 'primary',
  disabled: false,
  readonly: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: DateModelValue]
  'range-start': [date: Date]
  'range-end': [date: Date]
  'month-change': [payload: { year: number; month: number }]
  'preset-select': [preset: PresetRange]
  'open': []
  'close': []
}>()

const rootEl = ref<HTMLElement | null>(null)
const isOpen = ref(false)

const resolvedFirstDayOfWeek = computed(() => props.firstDayOfWeek ?? 1)

// Date selection state machine
const dateState = useAdvancedDate({
  modelValue: toRef(props, 'modelValue') as any,
  range: toRef(props, 'range'),
  autoApply: toRef(props, 'autoApply'),
  allowedDates: toRef(props, 'allowedDates') as any,
  min: toRef(props, 'min') as any,
  max: toRef(props, 'max') as any,
})

// Set emitter
dateState.setEmitter((value) => {
  emit('update:modelValue', value)
})

// Hover preview
const hoverState = useHoverPreview({
  phase: dateState.phase,
  startDate: dateState.startDate,
})

// Fullscreen state
const fullscreenState = useFullscreen({
  fullscreen: toRef(props, 'fullscreen'),
})

// Formatted display value for the text input
const inputDisplayValue = computed(() => {
  if (dateState.startDate.value && dateState.endDate.value) {
    return `${formatDate(dateState.startDate.value)}${props.separator}${formatDate(dateState.endDate.value)}`
  }
  if (dateState.startDate.value) {
    return formatDate(dateState.startDate.value)
  }
  return ''
})

function openPicker() {
  if (props.disabled || props.readonly) return
  isOpen.value = true
  emit('open')
}

function closePicker() {
  isOpen.value = false
  emit('close')
  // Return focus to activator input
  nextTick(() => {
    const input = rootEl.value?.querySelector('input') as HTMLElement | null
    input?.focus()
  })
}

function onMenuToggle(value: boolean) {
  if (!value) {
    if (!props.autoApply) {
      dateState.cancel()
    }
    emit('close')
  }
}

function onDayClick(date: Date) {
  dateState.selectDate(date)

  if (dateState.phase.value === 'start-selected') {
    emit('range-start', date)
  } else if (dateState.phase.value === 'complete') {
    if (dateState.endDate.value) {
      emit('range-end', date)
    }
    if (props.autoApply && !props.range) {
      closePicker()
    }
    if (props.autoApply && props.range && dateState.endDate.value) {
      closePicker()
    }
  }
}

function onPresetSelect(preset: PresetRange) {
  const value = typeof preset.value === 'function' ? preset.value() : preset.value
  dateState.setRange(value[0], value[1])
  emit('preset-select', preset)

  if (props.autoApply) {
    closePicker()
  }
}

function onApply() {
  dateState.apply()
  closePicker()
}

function onCancel() {
  dateState.cancel()
  closePicker()
}

function onMonthChange(payload: { year: number; month: number }) {
  emit('month-change', payload)
}
</script>
