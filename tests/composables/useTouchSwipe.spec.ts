import { describe, expect, it, vi } from 'vitest'

import { useTouchSwipe } from '@/composables/useTouchSwipe'

describe('useTouchSwipe', () => {
  it('triggers the next callback on left swipe', () => {
    const onPrevious = vi.fn()
    const onNext = vi.fn()
    const swipe = useTouchSwipe({ onPrevious, onNext })

    swipe.touchHandlers.onTouchstart({
      changedTouches: [{ clientX: 100, clientY: 0 }],
    } as unknown as TouchEvent)

    swipe.touchHandlers.onTouchend({
      changedTouches: [{ clientX: 10, clientY: 5 }],
    } as unknown as TouchEvent)

    expect(onPrevious).not.toHaveBeenCalled()
    expect(onNext).toHaveBeenCalledTimes(1)
  })
})
