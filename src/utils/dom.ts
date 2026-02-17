/** Calculate swipe direction and velocity from touch events */
export interface SwipeResult {
  direction: 'left' | 'right' | 'up' | 'down' | 'none'
  deltaX: number
  deltaY: number
  velocity: number
  duration: number
}

export function calculateSwipe(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  startTime: number,
  endTime: number,
): SwipeResult {
  const deltaX = endX - startX
  const deltaY = endY - startY
  const duration = endTime - startTime
  const absDeltaX = Math.abs(deltaX)
  const absDeltaY = Math.abs(deltaY)
  const velocity = Math.max(absDeltaX, absDeltaY) / Math.max(duration, 1)

  let direction: SwipeResult['direction'] = 'none'
  if (absDeltaX > absDeltaY && absDeltaX > 10) {
    direction = deltaX < 0 ? 'left' : 'right'
  } else if (absDeltaY > absDeltaX && absDeltaY > 10) {
    direction = deltaY < 0 ? 'up' : 'down'
  }

  return { direction, deltaX, deltaY, velocity, duration }
}

/** Check if the user prefers reduced motion */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
