import { watch } from 'vue'

import { useLocale } from 'vuetify'

import { dateInputAdvancedCs } from '@/locale/cs'
import { dateInputAdvancedDe } from '@/locale/de'
import { dateInputAdvancedEn } from '@/locale/en'
import { dateInputAdvancedFr } from '@/locale/fr'
import { dateInputAdvancedIt } from '@/locale/it'
import { dateInputAdvancedLt } from '@/locale/lt'

const DATE_INPUT_ADVANCED_LOCALE_PREFIX = '$vuetify.dateInputAdvanced'

type LocaleMessageValue = string | LocaleMessageMap

interface LocaleMessageMap {
  [key: string]: LocaleMessageValue
}

const DATE_INPUT_ADVANCED_MESSAGES = {
  cs: dateInputAdvancedCs,
  de: dateInputAdvancedDe,
  en: dateInputAdvancedEn,
  fr: dateInputAdvancedFr,
  it: dateInputAdvancedIt,
  lt: dateInputAdvancedLt,
} as const

function isLocaleMessageMap(value: unknown): value is LocaleMessageMap {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function mergeLocaleMessageMaps(
  defaults: LocaleMessageMap,
  overrides: unknown,
): LocaleMessageMap {
  if (!isLocaleMessageMap(overrides)) return { ...defaults }

  const merged: LocaleMessageMap = { ...defaults }

  Object.entries(overrides).forEach(([key, value]) => {
    const defaultValue = defaults[key]

    if (isLocaleMessageMap(defaultValue) && isLocaleMessageMap(value)) {
      merged[key] = mergeLocaleMessageMaps(defaultValue, value)
      return
    }

    merged[key] = value as LocaleMessageValue
  })

  return merged
}

function hasLocaleMessageShape(
  defaults: LocaleMessageMap,
  candidate: unknown,
): boolean {
  if (!isLocaleMessageMap(candidate)) return false

  return Object.entries(defaults).every(([key, value]) => {
    const candidateValue = candidate[key]

    if (isLocaleMessageMap(value)) {
      return hasLocaleMessageShape(value, candidateValue)
    }

    return typeof candidateValue === 'string'
  })
}

function resolveDateInputAdvancedMessages(localeCode: string) {
  const normalized = localeCode.trim().toLowerCase()
  const base = normalized.split(/[-_]/)[0]

  return (
    DATE_INPUT_ADVANCED_MESSAGES[
      normalized as keyof typeof DATE_INPUT_ADVANCED_MESSAGES
    ] ??
    DATE_INPUT_ADVANCED_MESSAGES[
      base as keyof typeof DATE_INPUT_ADVANCED_MESSAGES
    ] ??
    dateInputAdvancedEn
  )
}

export function useDateInputAdvancedLocale() {
  const { current, fallback, messages, t } = useLocale()

  function ensureDateInputAdvancedMessages(localeCode: string | undefined) {
    if (!localeCode) return

    const defaults = resolveDateInputAdvancedMessages(localeCode)
    const localeEntry = isLocaleMessageMap(messages.value[localeCode])
      ? messages.value[localeCode]
      : {}
    const currentNamespace = localeEntry.dateInputAdvanced

    if (
      hasLocaleMessageShape(
        defaults.dateInputAdvanced as LocaleMessageMap,
        currentNamespace,
      )
    ) {
      return
    }

    messages.value = {
      ...messages.value,
      [localeCode]: {
        ...localeEntry,
        dateInputAdvanced: mergeLocaleMessageMaps(
          defaults.dateInputAdvanced as LocaleMessageMap,
          currentNamespace,
        ),
      },
    }
  }

  function ensureLocaleMessages() {
    const localeCodes = new Set(['en', current.value, fallback.value])

    localeCodes.forEach((localeCode) => {
      ensureDateInputAdvancedMessages(localeCode)
    })
  }

  ensureLocaleMessages()

  watch([current, fallback], () => {
    ensureLocaleMessages()
  })

  function tDateInputAdvanced(key: string, ...params: unknown[]) {
    return t(`${DATE_INPUT_ADVANCED_LOCALE_PREFIX}.${key}`, ...params)
  }

  return {
    tDateInputAdvanced,
  }
}
