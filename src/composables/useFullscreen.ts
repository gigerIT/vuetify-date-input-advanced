import { computed, type Ref } from 'vue'

export function useFullscreen(
  fullscreen: Ref<boolean | 'auto'>,
  mobile: Ref<boolean>,
) {
  const isFullscreen = computed(() => {
    if (fullscreen.value === 'auto') return mobile.value
    return fullscreen.value
  })

  return {
    isFullscreen,
  }
}
