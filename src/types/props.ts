import type { PropType } from 'vue'
import type { PresetRange } from './presets'

/** Selection state during range picking */
export type SelectionPhase = 'idle' | 'start-selected' | 'complete'

/** Model value type: single date, date range tuple, or null */
export type DateModelValue = Date | [Date, Date] | null

/** Fullscreen mode option */
export type FullscreenMode = boolean | 'auto'

/** Advanced date input props definition for use with defineProps / defineComponent */
export const advancedDateInputProps = {
  modelValue: {
    type: [Date, Array, null] as PropType<DateModelValue>,
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
  min: {
    type: [Date, String] as PropType<Date | string>,
    default: undefined,
  },
  max: {
    type: [Date, String] as PropType<Date | string>,
    default: undefined,
  },
  allowedDates: {
    type: Function as PropType<(date: Date) => boolean>,
    default: undefined,
  },
  inline: {
    type: Boolean,
    default: false,
  },
  showWeekNumbers: {
    type: Boolean,
    default: false,
  },
  sixWeeks: {
    type: [Boolean, String] as PropType<boolean | 'append' | 'prepend'>,
    default: false,
  },
  swipeable: {
    type: Boolean,
    default: true,
  },
  fullscreen: {
    type: [Boolean, String] as PropType<FullscreenMode>,
    default: 'auto',
  },
  hideYearMenu: {
    type: Boolean,
    default: false,
  },
  format: {
    type: String,
    default: 'MMM DD, YYYY',
  },
  separator: {
    type: String,
    default: ' – ',
  },
  firstDayOfWeek: {
    type: Number,
    default: undefined,
  },
  label: {
    type: String,
    default: undefined,
  },
  variant: {
    type: String as PropType<'outlined' | 'filled' | 'underlined' | 'plain' | 'solo' | 'solo-inverted' | 'solo-filled'>,
    default: 'outlined',
  },
  density: {
    type: String as PropType<'default' | 'comfortable' | 'compact'>,
    default: 'default',
  },
  color: {
    type: String,
    default: 'primary',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
} as const
