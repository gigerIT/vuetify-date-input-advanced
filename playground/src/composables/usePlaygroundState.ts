import { computed, ref, watch } from 'vue'
import { useLocale, useTheme } from 'vuetify'

import type {
  PlaygroundLocale,
  PlaygroundTab,
  PlaygroundTabOption,
  SelectOption,
  ThemeMode,
} from '../playgroundTypes'
import {
  normalizePlaygroundLocale,
  normalizeThemeMode,
  writePlaygroundLocalePreference,
  writeThemeModePreference,
} from '../playgroundPreferences'

const localeOptions = [
  { title: 'English', value: 'en' },
  { title: 'Français', value: 'fr' },
  { title: 'Deutsch', value: 'de' },
  { title: 'Italiano', value: 'it' },
  { title: 'Čeština', value: 'cs' },
  { title: 'Lietuvių', value: 'lt' },
] satisfies SelectOption<PlaygroundLocale>[]

const themeModeOptions = [
  { title: 'Light', value: 'light' },
  { title: 'Dark', value: 'dark' },
  { title: 'System', value: 'system' },
] satisfies SelectOption<ThemeMode>[]

const tabOptions = [
  { title: 'Examples', value: 'examples' },
  { title: 'Playground', value: 'playground' },
  { title: 'Advanced', value: 'advanced' },
] satisfies PlaygroundTabOption[]

export function usePlaygroundState() {
  const { current: currentLocale } = useLocale()
  const theme = useTheme()
  const currentTab = ref<PlaygroundTab>('examples')

  const playgroundLocale = computed<PlaygroundLocale>({
    get: () => normalizePlaygroundLocale(currentLocale.value),
    set: (value) => {
      currentLocale.value = value
    },
  })
  const themeMode = computed<ThemeMode>({
    get: () => normalizeThemeMode(theme.global.name.value),
    set: (value) => {
      theme.global.name.value = value
    },
  })

  watch(
    playgroundLocale,
    (value) => {
      writePlaygroundLocalePreference(value)
    },
    { immediate: true },
  )

  watch(
    themeMode,
    (value) => {
      writeThemeModePreference(value)
    },
    { immediate: true },
  )

  return {
    currentTab,
    localeOptions,
    playgroundLocale,
    tabOptions,
    themeMode,
    themeModeOptions,
  }
}
