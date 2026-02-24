import { onBeforeUnmount, onMounted, type Ref } from 'vue'

interface SwipeOptions {
  enabled: Ref<boolean>
  onPrev: () => void
  onNext: () => void
}

const THRESHOLD_PX = 50
const VELOCITY_THRESHOLD = 0.3

export function useSwipe(target: Ref<HTMLElement | null>, options: SwipeOptions) {
  let startX = 0
  let startY = 0
  let startTime = 0

  const onTouchStart = (event: TouchEvent) => {
    if (!options.enabled.value) return
    const touch = event.touches[0]
    startX = touch.clientX
    startY = touch.clientY
    startTime = performance.now()
  }

  const onTouchEnd = (event: TouchEvent) => {
    if (!options.enabled.value) return
    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - startX
    const deltaY = touch.clientY - startY

    if (Math.abs(deltaY) > Math.abs(deltaX)) return
    if (Math.abs(deltaX) < THRESHOLD_PX) return

    const duration = Math.max(1, performance.now() - startTime)
    const velocity = Math.abs(deltaX) / duration
    if (velocity < VELOCITY_THRESHOLD) return

    if (deltaX < 0) options.onNext()
    else options.onPrev()
  }

  onMounted(() => {
    if (!target.value) return
    target.value.addEventListener('touchstart', onTouchStart, { passive: true })
    target.value.addEventListener('touchend', onTouchEnd, { passive: true })
  })

  onBeforeUnmount(() => {
    if (!target.value) return
    target.value.removeEventListener('touchstart', onTouchStart)
    target.value.removeEventListener('touchend', onTouchEnd)
  })
}
