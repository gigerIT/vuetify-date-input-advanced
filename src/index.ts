// Styles
import './styles/main.scss'

// Plugin
export { createAdvancedDateInput } from './plugin'
export type { AdvancedDateInputPluginOptions } from './plugin'

// Components
export { VAdvancedDateInput } from './components/VAdvancedDateInput'
export { VAdvancedDatePicker } from './components/VAdvancedDatePicker'
export { VAdvancedDatePresets } from './components/VAdvancedDatePresets'
export { VAdvancedDateHeader } from './components/VAdvancedDateHeader'
export { VAdvancedDateMonth } from './components/VAdvancedDateMonth'

// Composables
export { useAdvancedDate } from './composables/useAdvancedDate'
export { useMultiMonth } from './composables/useMultiMonth'
export { useHoverPreview } from './composables/useHoverPreview'
export { usePresets } from './composables/usePresets'
export { useSwipe } from './composables/useSwipe'
export { useFullscreen } from './composables/useFullscreen'

// Types
export type { PresetRange, DateModelValue, FullscreenMode, SelectionPhase } from './types'
