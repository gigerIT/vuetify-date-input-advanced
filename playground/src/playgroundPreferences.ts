import type { PlaygroundLocale, ThemeMode } from './playgroundTypes'

const PLAYGROUND_LOCALE_STORAGE_KEY =
  'vuetify-date-input-advanced:playground-locale'
const THEME_MODE_STORAGE_KEY =
  'vuetify-date-input-advanced:playground-theme-mode'

const DEFAULT_PLAYGROUND_LOCALE: PlaygroundLocale = 'en'
const DEFAULT_THEME_MODE: ThemeMode = 'system'

function canUseLocalStorage() {
  return (
    typeof window !== 'undefined' &&
    typeof window.localStorage !== 'undefined' &&
    typeof window.localStorage.getItem === 'function' &&
    typeof window.localStorage.setItem === 'function'
  )
}

export function normalizePlaygroundLocale(
  value: string | null | undefined,
): PlaygroundLocale {
  return value === 'cs' ||
    value === 'de' ||
    value === 'en' ||
    value === 'fr' ||
    value === 'it' ||
    value === 'lt'
    ? value
    : DEFAULT_PLAYGROUND_LOCALE
}

export function normalizeThemeMode(
  value: string | null | undefined,
): ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system'
    ? value
    : DEFAULT_THEME_MODE
}

export function readPlaygroundLocalePreference(): PlaygroundLocale {
  if (!canUseLocalStorage()) return DEFAULT_PLAYGROUND_LOCALE

  return normalizePlaygroundLocale(
    window.localStorage.getItem(PLAYGROUND_LOCALE_STORAGE_KEY),
  )
}

export function writePlaygroundLocalePreference(value: PlaygroundLocale) {
  if (!canUseLocalStorage()) return

  window.localStorage.setItem(PLAYGROUND_LOCALE_STORAGE_KEY, value)
}

export function readThemeModePreference(): ThemeMode {
  if (!canUseLocalStorage()) return DEFAULT_THEME_MODE

  return normalizeThemeMode(window.localStorage.getItem(THEME_MODE_STORAGE_KEY))
}

export function writeThemeModePreference(value: ThemeMode) {
  if (!canUseLocalStorage()) return

  window.localStorage.setItem(THEME_MODE_STORAGE_KEY, value)
}
