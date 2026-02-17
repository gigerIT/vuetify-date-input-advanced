import { computed, type Ref } from 'vue'
import { useDisplay } from 'vuetify'
import type { FullscreenMode } from '../types'

export interface UseFullscreenOptions {
  fullscreen: Ref<FullscreenMode>
}

export function useFullscreen(options: UseFullscreenOptions) {
  const { fullscreen } = options
  const display = useDisplay()

  const isFullscreen = computed(() => {
    if (fullscreen.value === true) return true
    if (fullscreen.value === false) return false
    // 'auto' mode: fullscreen on xs and sm
    return display.smAndDown.value
  })

  const isMobile = computed(() => display.smAndDown.value)

  /** Clamped month count based on breakpoint */
  const maxMonthsForBreakpoint = computed(() => {
    if (display.xs.value) return 1
    if (display.sm.value) return 1
    if (display.md.value) return 2
    if (display.lg.value) return 3
    return 12 // xl: no limit
  })

  return {
    isFullscreen,
    isMobile,
    maxMonthsForBreakpoint,
  }
}
