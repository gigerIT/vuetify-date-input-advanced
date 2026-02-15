# vuetify-date-input-advanced

Advanced date picker and input component for **Vuetify 3**. Extends `VDatePicker` with multi-month display, date range selection with hover preview, predefined date range presets, swipe navigation, fullscreen mobile mode, and responsive breakpoint-aware layouts.

Ships as a Vue 3 plugin that registers components into the Vuetify ecosystem using the official extension pattern — wrapper components that inherit Vuetify props, integrate with `useDefaults()`, and participate in the Vuetify theming system.

## Features

- **Date range selection** with hover preview, click-to-start / click-to-end
- **Multi-month display** — show N months side-by-side, responsive clamping per breakpoint
- **Predefined date range presets** — 10 built-in presets (Today, Last 7 Days, This Quarter, etc.) with full customization
- **Fullscreen mobile mode** — auto-detects mobile breakpoints, bottom-sheet slide-up with horizontal preset chips
- **Swipe navigation** — touch gestures with velocity detection, direction locking, momentum (2-month skip)
- **Disable year menu** — lock the header to month-level navigation only
- **Single date mode** — toggle between range and single date picker
- **Inline mode** — render the picker directly without a popup
- **Confirm/auto-apply** — immediate selection or cancel/apply flow
- **Keyboard navigation** — arrow keys, Enter, Escape, Tab (WAI-ARIA grid pattern)
- **Accessibility** — WCAG 2.1 AA, `aria-live` announcements, focus trapping, `prefers-reduced-motion` support
- **Theming** — CSS custom properties, Vuetify theme integration, dark mode support
- **TypeScript** — fully typed props, events, slots, and composables
- **Zero extra dependencies** — only Vue 3 and Vuetify 3 as peer dependencies

## Installation

```bash
npm install vuetify-date-input-advanced
```

### Peer dependencies

```bash
npm install vue@^3.5 vuetify@^3.11
```

## Quick Start

### Plugin registration

```ts
// main.ts
import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import { createAdvancedDateInput } from 'vuetify-date-input-advanced'
import 'vuetify-date-input-advanced/styles'

const vuetify = createVuetify({
  defaults: {
    VAdvancedDateInput: {
      months: 2,
      autoApply: true,
      showPresets: true,
    },
  },
})

const app = createApp(App)
app.use(vuetify)
app.use(createAdvancedDateInput())
app.mount('#app')
```

Or register individual components:

```ts
import { VAdvancedDateInput, VAdvancedDatePicker } from 'vuetify-date-input-advanced'
import 'vuetify-date-input-advanced/styles'

app.component('VAdvancedDateInput', VAdvancedDateInput)
```

### Basic date range picker

```vue
<template>
  <v-advanced-date-input
    v-model="dateRange"
    :months="2"
    show-presets
    label="Select date range"
    variant="outlined"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { DateModelValue } from 'vuetify-date-input-advanced'

const dateRange = ref<DateModelValue>(null)
</script>
```

### Single date picker

```vue
<v-advanced-date-input
  v-model="singleDate"
  :range="false"
  :months="1"
  :show-presets="false"
  label="Select a date"
/>
```

### With confirm button

```vue
<v-advanced-date-input
  v-model="dateRange"
  :auto-apply="false"
  label="Select range (confirm required)"
/>
```

### Fullscreen (forced)

```vue
<v-advanced-date-input
  v-model="dateRange"
  :fullscreen="true"
  label="Mobile-style fullscreen picker"
/>
```

### Hidden year menu

```vue
<v-advanced-date-input
  v-model="dateRange"
  :hide-year-menu="true"
  label="No year dropdown in header"
/>
```

### Custom presets

```vue
<template>
  <v-advanced-date-input v-model="dateRange" :presets="customPresets" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { PresetRange, DateModelValue } from 'vuetify-date-input-advanced'

const dateRange = ref<DateModelValue>(null)

const customPresets: PresetRange[] = [
  {
    label: 'Last 7 Days',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 6)
      return [start, end]
    },
  },
  {
    label: 'Last 30 Days',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 29)
      return [start, end]
    },
  },
]
</script>
```

### Inline picker (no popup)

```vue
<v-advanced-date-input
  v-model="dateRange"
  :months="2"
  :inline="true"
  show-presets
/>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `modelValue` | `Date \| [Date, Date] \| null` | `null` | Selected date or range |
| `range` | `boolean` | `true` | Enable date range selection |
| `months` | `number` | `2` | Max number of months displayed (clamped by breakpoint) |
| `presets` | `PresetRange[]` | Built-in defaults | Predefined date ranges |
| `showPresets` | `boolean` | `true` | Show preset sidebar / chip row |
| `autoApply` | `boolean` | `true` | Apply selection immediately (no confirm button) |
| `min` | `Date \| string` | — | Minimum selectable date |
| `max` | `Date \| string` | — | Maximum selectable date |
| `allowedDates` | `(date: Date) => boolean` | — | Filter which dates are selectable |
| `inline` | `boolean` | `false` | Render inline (no popup) |
| `showWeekNumbers` | `boolean` | `false` | Display ISO week numbers |
| `sixWeeks` | `boolean \| 'append' \| 'prepend'` | `false` | Force 6-week display for consistent height |
| `swipeable` | `boolean` | `true` | Enable touch swipe navigation |
| `fullscreen` | `boolean \| 'auto'` | `'auto'` | `true` = always fullscreen, `false` = never, `'auto'` = mobile only |
| `hideYearMenu` | `boolean` | `false` | Disable the year picker dropdown in the header |
| `format` | `string` | `'MMM DD, YYYY'` | Display format in the text input |
| `separator` | `string` | `' – '` | Separator between start and end dates |
| `firstDayOfWeek` | `number` | `1` (Monday) | 0 = Sunday, 1 = Monday, etc. |
| `label` | `string` | — | Input label (forwarded to VTextField) |
| `variant` | Vuetify variants | `'outlined'` | Input variant (forwarded to VTextField) |
| `density` | `'default' \| 'comfortable' \| 'compact'` | `'default'` | Density (forwarded to VTextField) |
| `color` | `string` | `'primary'` | Selection color |
| `disabled` | `boolean` | `false` | Disable the component |
| `readonly` | `boolean` | `false` | Readonly mode |

## Events

| Event | Payload | Description |
|---|---|---|
| `update:modelValue` | `Date \| [Date, Date] \| null` | Selection changed |
| `range-start` | `Date` | Start date selected (first click) |
| `range-end` | `Date` | End date selected (second click) |
| `month-change` | `{ year: number, month: number }` | Visible month changed |
| `preset-select` | `PresetRange` | A preset was clicked |
| `open` | — | Picker popup opened |
| `close` | — | Picker popup closed |

## Slots

| Slot | Scope | Description |
|---|---|---|
| `activator` | `{ props: Record<string, any>, isActive: boolean }` | Custom activator replacing the text input |
| `actions` | `{ apply: () => void, cancel: () => void }` | Custom action buttons (when `autoApply=false`) |
| `preset` | `{ preset: PresetRange, active: boolean }` | Custom preset item rendering |

## Responsive Behavior

The component automatically adapts its layout at every Vuetify breakpoint:

| Breakpoint | Container | Month Layout | Presets | Months |
|---|---|---|---|---|
| **xs** (< 600px) | Fullscreen dialog | Vertical stack | Horizontal chip row | 1 |
| **sm** (600–959px) | Fullscreen dialog | Vertical stack | Horizontal chip row | 1 |
| **md** (960–1279px) | Menu popover | Side-by-side | Sidebar | Up to 2 |
| **lg** (1280–1919px) | Menu popover | Side-by-side | Sidebar | Up to 3 |
| **xl** (1920+) | Menu popover | Side-by-side | Sidebar | As configured |

The `months` prop is a **maximum** — the component clamps it based on available space. On mobile (`xs`/`sm`), `fullscreen="auto"` activates a fullscreen dialog with:

- Fixed top bar with title and close button
- Horizontal scrollable preset chips (snap-scroll)
- Vertically stacked swipeable months
- Sticky bottom action bar (Cancel / Apply)
- 44x44px minimum touch targets (Apple HIG compliant)
- Bottom-sheet slide-up / slide-down animation

## CSS Custom Properties

Override these to customize the appearance:

```css
:root {
  --v-advanced-date-range-bg: rgba(var(--v-theme-primary), 0.1);
  --v-advanced-date-range-hover-bg: rgba(var(--v-theme-primary), 0.05);
  --v-advanced-date-selected-bg: rgb(var(--v-theme-primary));
  --v-advanced-date-selected-text: rgb(var(--v-theme-on-primary));
  --v-advanced-date-today-border: 1px solid rgb(var(--v-theme-primary));
  --v-advanced-date-preset-active-bg: rgba(var(--v-theme-primary), 0.08);
  --v-advanced-date-sidebar-width: 180px;
  --v-advanced-date-cell-size: 36px;
  --v-advanced-date-cell-size-mobile: 44px;
  --v-advanced-date-month-gap: 16px;
  --v-advanced-date-transition-duration: 200ms;
  --v-advanced-date-fullscreen-header-height: 56px;
  --v-advanced-date-fullscreen-bottom-bar-height: 64px;
  --v-advanced-date-border-radius: 8px;
}
```

All animations respect `prefers-reduced-motion: reduce` — transitions are automatically disabled.

## Composables

All composables are exported for advanced use cases:

```ts
import {
  useAdvancedDate,   // Date range selection state machine
  useMultiMonth,     // Multi-month navigation + breakpoint clamping
  useHoverPreview,   // Hover date tracking and preview range
  usePresets,        // Preset computation + active detection
  useSwipe,          // Touch swipe with velocity, direction lock, momentum
  useFullscreen,     // Resolves fullscreen prop vs display breakpoint
} from 'vuetify-date-input-advanced'
```

## Types

```ts
import type {
  PresetRange,      // { label: string, value: [Date, Date] | (() => [Date, Date]), slot?: string }
  DateModelValue,   // Date | [Date, Date] | null
  FullscreenMode,   // boolean | 'auto'
  SelectionPhase,   // 'idle' | 'start-selected' | 'complete'
} from 'vuetify-date-input-advanced'
```

## Built-in Presets

When no `presets` prop is provided, the following defaults are used:

| Preset | Range |
|---|---|
| Today | Current day |
| Yesterday | Previous day |
| Last 7 Days | Past 7 days including today |
| Last 30 Days | Past 30 days including today |
| This Month | First to last day of current month |
| Last Month | First to last day of previous month |
| This Quarter | Current fiscal quarter |
| Last Quarter | Previous fiscal quarter |
| Year to Date | Jan 1 to today |
| Last Year | Full previous calendar year |

## Keyboard Navigation

| Key | Action |
|---|---|
| `Arrow Left` | Move focus to previous day |
| `Arrow Right` | Move focus to next day |
| `Arrow Up` | Move focus to same day previous week |
| `Arrow Down` | Move focus to same day next week |
| `Enter` / `Space` | Select the focused date |
| `Escape` | Close picker (cancel if `autoApply=false`) |
| `Tab` | Move between presets, calendar, and action buttons |

## Development

```bash
# Install dependencies
npm install

# Start playground dev server
npm run dev

# Build library
npm run build:lib

# Type check
npm run typecheck

# Run tests
npm test
```

## License

MIT
