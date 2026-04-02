import ResizeObserver from 'resize-observer-polyfill'

globalThis.ResizeObserver = ResizeObserver as typeof ResizeObserver
globalThis.visualViewport = {
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  dispatchEvent: () => true,
  width: 1280,
  height: 720,
  offsetLeft: 0,
  offsetTop: 0,
  pageLeft: 0,
  pageTop: 0,
  scale: 1,
} as unknown as VisualViewport
