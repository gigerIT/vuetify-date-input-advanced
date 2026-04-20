import {
  normalizePlaygroundLocale,
  normalizeThemeMode,
  readPlaygroundLocalePreference,
  readThemeModePreference,
  writePlaygroundLocalePreference,
  writeThemeModePreference,
} from '../../playground/src/playgroundPreferences'

describe('playground preferences', () => {
  beforeEach(() => {
    const storage = new Map<string, string>()

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        clear: () => {
          storage.clear()
        },
        getItem: (key: string) => storage.get(key) ?? null,
        removeItem: (key: string) => {
          storage.delete(key)
        },
        setItem: (key: string, value: string) => {
          storage.set(key, value)
        },
      },
    })
  })

  it('falls back to default values for invalid stored preferences', () => {
    window.localStorage.setItem(
      'vuetify-date-input-advanced:playground-locale',
      'invalid',
    )
    window.localStorage.setItem(
      'vuetify-date-input-advanced:playground-theme-mode',
      'invalid',
    )

    expect(readPlaygroundLocalePreference()).toBe('en')
    expect(readThemeModePreference()).toBe('system')
  })

  it('persists locale and theme mode preferences', () => {
    writePlaygroundLocalePreference('fr')
    writeThemeModePreference('dark')

    expect(readPlaygroundLocalePreference()).toBe('fr')
    expect(readThemeModePreference()).toBe('dark')
  })

  it('normalizes unknown values', () => {
    expect(normalizePlaygroundLocale('xx')).toBe('en')
    expect(normalizeThemeMode('sepia')).toBe('system')
  })
})
