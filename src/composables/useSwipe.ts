import { ref, onMounted, onUnmounted, type Ref } from 'vue'
import { prefersReducedMotion } from '../utils/dom'

export interface UseSwipeOptions {
  /** Element ref to attach listeners on */
  el: Ref<HTMLElement | null>
  /** Minimum distance (px) to register a swipe */
  threshold?: number
  /** Minimum velocity (px/ms) */
  minVelocity?: number
  /** High velocity threshold for skipping 2 months */
  momentumVelocity?: number
  /** Whether swipe is enabled */
  enabled: Ref<boolean>
  onSwipeLeft?: (momentum: boolean) => void
  onSwipeRight?: (momentum: boolean) => void
}

export function useSwipe(options: UseSwipeOptions) {
  const {
    el,
    threshold = 50,
    minVelocity = 0.3,
    momentumVelocity = 1.0,
    enabled,
    onSwipeLeft,
    onSwipeRight,
  } = options

  const isSwiping = ref(false)
  const swipeOffset = ref(0)
  const directionLocked = ref<'horizontal' | 'vertical' | null>(null)

  let startX = 0
  let startY = 0
  let startTime = 0

  function onTouchStart(e: TouchEvent) {
    if (!enabled.value) return
    const touch = e.touches[0]
    startX = touch.clientX
    startY = touch.clientY
    startTime = Date.now()
    directionLocked.value = null
    isSwiping.value = false
    swipeOffset.value = 0
  }

  function onTouchMove(e: TouchEvent) {
    if (!enabled.value) return
    const touch = e.touches[0]
    const deltaX = touch.clientX - startX
    const deltaY = touch.clientY - startY

    // Direction lock: determine within first 10px of movement
    if (!directionLocked.value) {
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        directionLocked.value = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical'
      }
    }

    // Only track horizontal swipes
    if (directionLocked.value === 'horizontal') {
      isSwiping.value = true
      swipeOffset.value = deltaX
      // Prevent vertical scroll while swiping
      e.preventDefault()
    }
  }

  function onTouchEnd(e: TouchEvent) {
    if (!enabled.value || !isSwiping.value) {
      isSwiping.value = false
      swipeOffset.value = 0
      return
    }

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - startX
    const duration = Date.now() - startTime
    const velocity = Math.abs(deltaX) / Math.max(duration, 1)
    const absDelta = Math.abs(deltaX)

    isSwiping.value = false
    swipeOffset.value = 0

    // Must exceed threshold and minimum velocity
    if (absDelta >= threshold && velocity >= minVelocity) {
      const momentum = velocity >= momentumVelocity
      if (deltaX < 0) {
        onSwipeLeft?.(momentum)
      } else {
        onSwipeRight?.(momentum)
      }
    }
  }

  onMounted(() => {
    const element = el.value
    if (!element) return
    element.addEventListener('touchstart', onTouchStart, { passive: true })
    element.addEventListener('touchmove', onTouchMove, { passive: false })
    element.addEventListener('touchend', onTouchEnd, { passive: true })
  })

  onUnmounted(() => {
    const element = el.value
    if (!element) return
    element.removeEventListener('touchstart', onTouchStart)
    element.removeEventListener('touchmove', onTouchMove)
    element.removeEventListener('touchend', onTouchEnd)
  })

  return {
    isSwiping,
    swipeOffset,
  }
}
