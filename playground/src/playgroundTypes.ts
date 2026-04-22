import type {
  AdvancedDateInputCloseStrategy,
  AdvancedDateInputField,
} from '@gigerit/vuetify-date-input-advanced'

export type PlaygroundTab = 'examples' | 'playground' | 'advanced'
export type PlaygroundPreviewMode = 'both' | 'input' | 'picker'
export type PlaygroundPresetMode = 'hidden' | 'default' | 'custom'
export type PlaygroundConstraintMode =
  | 'none'
  | 'window'
  | 'weekdays'
  | 'split-range'
  | 'sparse'
export type PlaygroundParseMode = 'adapter' | 'iso' | 'us'
export type PlaygroundRuleMode = 'none' | 'required' | 'min-nights'
export type PlaygroundFieldPropsMode =
  | 'single'
  | 'split'
  | 'split-readonly-start'
  | 'split-readonly-end'
export type PlaygroundHideDetailsMode = 'auto' | 'show' | 'hide'
export type PlaygroundThemeOverride = 'inherit' | 'light' | 'dark'
export type PlaygroundRoundedMode =
  | 'default'
  | 'none'
  | 'lg'
  | 'pill'
  | 'numeric'
export type PlaygroundBorderMode = 'default' | 'none' | 'sm' | 'lg'
export type InlineDensity = 'default' | 'comfortable' | 'compact'
export type PlaygroundLocale = 'cs' | 'de' | 'en' | 'fr' | 'it' | 'lt'
export type ThemeMode = 'dark' | 'light' | 'system'

export interface SelectOption<TValue extends string | number> {
  title: string
  value: TValue
}

export interface PlaygroundTabOption {
  title: string
  value: PlaygroundTab
}

export interface PlaygroundLabOptions {
  previewMode: PlaygroundPreviewMode
  range: boolean
  returnObject: boolean
  months: number
  lockViewport: boolean
  month: number
  year: number
  autoApply: boolean
  presetMode: PlaygroundPresetMode
  showWeekNumbers: boolean
  firstDayOfWeek: number
  disabled: boolean
  readonly: boolean
  inline: boolean
  inputReadonly: boolean
  menu: boolean
  focused: boolean
  activeField: AdvancedDateInputField | 'auto'
  closeDraftStrategy: AdvancedDateInputCloseStrategy
  label: string
  placeholder: string
  title: string
  titleStartDate: string
  titleEndDate: string
  displayFormat: string
  rangeSeparator: string
  variant: string
  hideDetails: PlaygroundHideDetailsMode
  messagesText: string
  forceError: boolean
  errorMessageText: string
  clearable: boolean
  color: string
  density: InlineDensity
  themeName: PlaygroundThemeOverride
  rounded: PlaygroundRoundedMode
  border: PlaygroundBorderMode
  elevation: number
  width: string
  minWidth: string
  maxWidth: string
  prevIcon: string
  nextIcon: string
  prependInnerIcon: string
  appendInnerIcon: string
  constraintMode: PlaygroundConstraintMode
  parseMode: PlaygroundParseMode
  ruleMode: PlaygroundRuleMode
  fieldPropsMode: PlaygroundFieldPropsMode
  draftText: string
}
