<script setup lang="ts">
import { computed, ref, toRef, watch, type PropType } from 'vue'
import { useDate, useDefaults, useDisplay } from 'vuetify'
import {
  formatDisplayValue,
  parseInputValue,
  useFullscreen,
} from '@/composables'
import { cloneModelValue } from '@/utils/dateHelpers'
import type { PresetRange, ResolvedPresetRange } from '@/types'
import { VDatePickerAdvanced } from '@/components/VDatePickerAdvanced'

defineOptions({
  name: 'VDateInputAdvanced',
})

const rawProps = defineProps({
  modelValue: {
    type: null as unknown as PropType<unknown | unknown[] | null>,
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
  inline: {
    type: Boolean,
    default: false,
  },
  swipeable: {
    type: Boolean,
    default: true,
  },
  fullscreen: {
    type: [Boolean, String] as PropType<boolean | 'auto'>,
    default: 'auto',
  },
  hideYearMenu: {
    type: Boolean,
    default: false,
  },
  displayFormat: {
    type: [String, Function] as PropType<string | ((date: unknown) => string)>,
    default: undefined,
  },
  inputFormat: {
    type: String,
    default: 'yyyy-mm-dd',
  },
  updateOn: {
    type: Array as PropType<Array<'blur' | 'enter'>>,
    default: () => ['blur', 'enter'],
  },
  separator: {
    type: String,
    default: ' - ',
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
  mobileBreakpoint: {
    type: [Number, String] as PropType<number | string>,
    default: undefined,
  },
  cancelText: {
    type: String,
    default: '$vuetify.confirmEdit.cancel',
  },
  okText: {
    type: String,
    default: '$vuetify.confirmEdit.ok',
  },
  label: {
    type: String,
    default: undefined,
  },
  placeholder: {
    type: String,
    default: undefined,
  },
  variant: {
    type: String as PropType<
      'outlined' | 'plain' | 'underlined' | 'filled' | 'solo' | 'solo-inverted' | 'solo-filled'
    >,
    default: 'filled',
  },
  density: {
    type: String as PropType<'default' | 'comfortable' | 'compact'>,
    default: 'default',
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
  clearable: {
    type: Boolean,
    default: false,
  },
  hideDetails: {
    type: [Boolean, String] as PropType<boolean | 'auto'>,
    default: false,
  },
  errorMessages: {
    type: [String, Array] as PropType<string | string[]>,
    default: () => [],
  },
  rules: {
    type: Array as PropType<Array<(value: unknown) => true | string>>,
    default: () => [],
  },
})

const props = useDefaults(rawProps, 'VDateInputAdvanced')

const emit = defineEmits<{
  (e: 'update:modelValue', value: unknown | unknown[] | null): void
  (e: 'range-start', value: unknown): void
  (e: 'range-end', value: unknown): void
  (e: 'month-change', value: { month: number; year: number }): void
  (e: 'preset-select', value: ResolvedPresetRange): void
  (e: 'open'): void
  (e: 'close'): void
}>()

const adapter = useDate()
const display = useDisplay({ mobileBreakpoint: props.mobileBreakpoint as never })
const { isFullscreen } = useFullscreen(toRef(props, 'fullscreen'), display.mobile)

const menu = ref(false)
const inputValue = ref('')
const draftValue = ref<unknown | unknown[] | null>(cloneModelValue(props.modelValue))

const isInteractive = computed(() => !props.disabled && !props.readonly)
const isInputReadonly = computed(() => props.readonly || !props.updateOn.length)

const displayText = computed(() => {
  return formatDisplayValue(adapter, props.modelValue, {
    range: props.range,
    separator: props.separator,
    displayFormat: props.displayFormat,
  })
})

const currentPickerValue = computed<unknown | unknown[] | null>(() => {
  if (props.autoApply) return props.modelValue
  return draftValue.value
})

const pickerModelValue = computed(() => currentPickerValue.value as never)

watch(
  () => props.modelValue,
  (value) => {
    if (props.autoApply || !menu.value) {
      draftValue.value = cloneModelValue(value)
    }
    inputValue.value = displayText.value
  },
  { immediate: true },
)

watch(menu, (next, prev) => {
  if (!prev && next) {
    if (!props.autoApply) {
      draftValue.value = cloneModelValue(props.modelValue)
    }
    emit('open')
  }

  if (prev && !next) {
    emit('close')
  }
})

function open() {
  if (!isInteractive.value || props.inline) return
  menu.value = true
}

function close() {
  if (props.inline) return
  menu.value = false
}

function parseAndEmit() {
  if (isInputReadonly.value) return

  const parsed = parseInputValue(adapter, inputValue.value, {
    range: props.range,
    separator: props.separator,
    inputFormat: props.inputFormat,
  })

  emit('update:modelValue', parsed)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter') return
  if (!menu.value) open()
  if (props.updateOn.includes('enter')) {
    parseAndEmit()
  }
}

function onBlur() {
  if (props.updateOn.includes('blur')) {
    parseAndEmit()
  }
}

function onPickerUpdate(value: unknown | unknown[] | null) {
  if (props.autoApply) {
    emit('update:modelValue', value)
  } else {
    draftValue.value = cloneModelValue(value)
  }
}

function applyDraft() {
  emit('update:modelValue', cloneModelValue(draftValue.value))
  close()
}

function cancelDraft() {
  draftValue.value = cloneModelValue(props.modelValue)
  close()
}

function onPickerApply() {
  if (!props.autoApply) {
    applyDraft()
    return
  }
  close()
}
</script>

<template>
  <div class="v-date-input-advanced">
    <VDatePickerAdvanced
      v-if="inline"
      :model-value="pickerModelValue"
      :range="range"
      :months="months"
      :presets="presets"
      :show-presets="showPresets"
      :auto-apply="autoApply"
      :swipeable="swipeable"
      :fullscreen="isFullscreen"
      :hide-year-menu="hideYearMenu"
      :min="min"
      :max="max"
      :allowed-dates="allowedDates"
      :allowed-months="allowedMonths"
      :allowed-years="allowedYears"
      :show-week="showWeek"
      :weeks-in-month="weeksInMonth"
      :first-day-of-week="firstDayOfWeek"
      :events="events"
      :event-color="eventColor"
      :show-adjacent-months="showAdjacentMonths"
      :control-variant="controlVariant"
      :view-mode="viewMode"
      :color="color"
      :disabled="disabled"
      :readonly="readonly"
      :mobile-breakpoint="mobileBreakpoint"
      :cancel-text="cancelText"
      :ok-text="okText"
      @update:model-value="onPickerUpdate"
      @range-start="emit('range-start', $event)"
      @range-end="emit('range-end', $event)"
      @month-change="emit('month-change', $event)"
      @preset-select="emit('preset-select', $event)"
      @apply="onPickerApply"
      @cancel="cancelDraft"
    >
      <template #preset="slotProps">
        <slot name="preset" v-bind="slotProps" />
      </template>
      <template #day="slotProps">
        <slot name="day" v-bind="slotProps" />
      </template>
      <template #header="slotProps">
        <slot name="header" v-bind="slotProps" />
      </template>
      <template #actions="slotProps">
        <slot name="actions" v-bind="slotProps" />
      </template>
    </VDatePickerAdvanced>

    <VTextField
      v-else
      class="v-date-input-advanced__input"
      :model-value="inputValue"
      :label="label"
      :placeholder="placeholder ?? inputFormat"
      :variant="variant"
      :density="density"
      :color="color"
      :disabled="disabled"
      :readonly="isInputReadonly"
      :clearable="clearable"
      :hide-details="hideDetails"
      :error-messages="errorMessages"
      :rules="rules"
      :focused="menu"
      @update:model-value="inputValue = $event"
      @keydown="onKeydown"
      @blur="onBlur"
      @click:control="open"
      @click:clear="emit('update:modelValue', range ? [] : null)"
    >
      <template #default>
        <VMenu
          v-if="!isFullscreen"
          v-model="menu"
          activator="parent"
          :close-on-content-click="false"
          location="bottom start"
          min-width="0"
        >
          <VCard>
            <VDatePickerAdvanced
              :model-value="pickerModelValue"
              :range="range"
              :months="months"
              :presets="presets"
              :show-presets="showPresets"
              :auto-apply="autoApply"
              :swipeable="swipeable"
              :fullscreen="false"
              :hide-year-menu="hideYearMenu"
              :min="min"
              :max="max"
              :allowed-dates="allowedDates"
              :allowed-months="allowedMonths"
              :allowed-years="allowedYears"
              :show-week="showWeek"
              :weeks-in-month="weeksInMonth"
              :first-day-of-week="firstDayOfWeek"
              :events="events"
              :event-color="eventColor"
              :show-adjacent-months="showAdjacentMonths"
              :control-variant="controlVariant"
              :view-mode="viewMode"
              :color="color"
              :disabled="disabled"
              :readonly="readonly"
              :mobile-breakpoint="mobileBreakpoint"
              :cancel-text="cancelText"
              :ok-text="okText"
              @update:model-value="onPickerUpdate"
              @range-start="emit('range-start', $event)"
              @range-end="emit('range-end', $event)"
              @month-change="emit('month-change', $event)"
              @preset-select="emit('preset-select', $event)"
              @apply="onPickerApply"
              @cancel="cancelDraft"
            >
              <template #preset="slotProps">
                <slot name="preset" v-bind="slotProps" />
              </template>
              <template #day="slotProps">
                <slot name="day" v-bind="slotProps" />
              </template>
              <template #header="slotProps">
                <slot name="header" v-bind="slotProps" />
              </template>
              <template #actions="slotProps">
                <slot name="actions" v-bind="slotProps" />
              </template>
            </VDatePickerAdvanced>
          </VCard>
        </VMenu>

        <VDialog v-else v-model="menu" fullscreen>
          <VCard class="v-date-input-advanced__dialog">
            <div class="v-date-input-advanced__dialog-top-bar">
              <slot name="title">Select date</slot>
              <VSpacer />
              <VBtn icon="$close" variant="text" @click="cancelDraft" />
            </div>

            <VDatePickerAdvanced
              :model-value="pickerModelValue"
              :range="range"
              :months="months"
              :presets="presets"
              :show-presets="showPresets"
              :auto-apply="autoApply"
              :swipeable="swipeable"
              :fullscreen="true"
              :hide-year-menu="hideYearMenu"
              :min="min"
              :max="max"
              :allowed-dates="allowedDates"
              :allowed-months="allowedMonths"
              :allowed-years="allowedYears"
              :show-week="showWeek"
              :weeks-in-month="weeksInMonth"
              :first-day-of-week="firstDayOfWeek"
              :events="events"
              :event-color="eventColor"
              :show-adjacent-months="showAdjacentMonths"
              :control-variant="controlVariant"
              :view-mode="viewMode"
              :color="color"
              :disabled="disabled"
              :readonly="readonly"
              :mobile-breakpoint="mobileBreakpoint"
              :cancel-text="cancelText"
              :ok-text="okText"
              @update:model-value="onPickerUpdate"
              @range-start="emit('range-start', $event)"
              @range-end="emit('range-end', $event)"
              @month-change="emit('month-change', $event)"
              @preset-select="emit('preset-select', $event)"
              @apply="onPickerApply"
              @cancel="cancelDraft"
            >
              <template #preset="slotProps">
                <slot name="preset" v-bind="slotProps" />
              </template>
              <template #day="slotProps">
                <slot name="day" v-bind="slotProps" />
              </template>
              <template #header="slotProps">
                <slot name="header" v-bind="slotProps" />
              </template>
              <template #actions="slotProps">
                <slot name="actions" v-bind="slotProps" />
              </template>
            </VDatePickerAdvanced>
          </VCard>
        </VDialog>
      </template>
    </VTextField>
  </div>
</template>

<style lang="scss">
@layer vuetify-date-input-advanced {
  .v-date-input-advanced__dialog {
    block-size: 100%;
    display: grid;
    grid-template-rows: auto 1fr;
  }

  .v-date-input-advanced__dialog-top-bar {
    align-items: center;
    display: grid;
    gap: 8px;
    grid-template-columns: auto 1fr auto;
    min-block-size: var(--v-date-input-advanced-fullscreen-header-height, 56px);
    padding: 0 8px;
  }
}
</style>
