export type InlinePresetMode = 'hidden' | 'default' | 'custom'
export type InlineDensity = 'default' | 'comfortable' | 'compact'
export type PlaygroundLocale = 'cs' | 'de' | 'en' | 'fr' | 'it' | 'lt'
export type ThemeMode = 'dark' | 'light' | 'system'

export interface InlineOptions {
  range: boolean
  months: number
  autoApply: boolean
  returnObject: boolean
  presetMode: InlinePresetMode
  showWeekNumbers: boolean
  firstDayOfWeek: number
  density: InlineDensity
  disabled: boolean
  readonly: boolean
}

export interface SelectOption<TValue extends string | number> {
  title: string
  value: TValue
}
