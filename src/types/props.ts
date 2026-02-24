import type { PresetRange } from './presets'

export interface DateInputAdvancedBaseProps {
  modelValue: unknown | unknown[] | null
  range: boolean
  months: number
  presets?: PresetRange[]
  showPresets: boolean
  autoApply: boolean
  inline: boolean
  swipeable: boolean
  fullscreen: boolean | 'auto'
  hideYearMenu: boolean
  separator: string
}
