import { ref } from 'vue'

export function useTouchSwipe(options: {
  disabled?: () => boolean
  onPrevious: () => void
  onNext: () => void
  threshold?: number
  velocity?: number
}) {
  const startX = ref(0)
  const startY = ref(0)
  const startTime = ref(0)

  function onTouchstart(event: TouchEvent) {
    if (options.disabled?.()) return

    const touch = event.changedTouches[0]
    startX.value = touch.clientX
    startY.value = touch.clientY
    startTime.value = performance.now()
  }

  function onTouchend(event: TouchEvent) {
    if (options.disabled?.()) return

    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - startX.value
    const deltaY = touch.clientY - startY.value
    const elapsed = Math.max(performance.now() - startTime.value, 1)
    const velocity = Math.abs(deltaX) / elapsed
    const threshold = options.threshold ?? 50
    const minVelocity = options.velocity ?? 0.35

    if (Math.abs(deltaX) <= Math.abs(deltaY)) return
    if (Math.abs(deltaX) < threshold && velocity < minVelocity) return

    if (deltaX > 0) options.onPrevious()
    else options.onNext()
  }

  return {
    touchHandlers: {
      onTouchstart,
      onTouchend,
    },
  }
}
