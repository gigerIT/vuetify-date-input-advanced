# vuetify-date-input-advanced - Project Plan

## Overview

A Vuetify 3 plugin package that extends `VDatePicker` and `VDateInput` with advanced features: multi-month display, swipe navigation, predefined date ranges sidebar, date range selection with hover preview, and responsive mobile support.

The package ships as a Vue 3 plugin that registers components into the Vuetify ecosystem using the **official extension pattern** — wrapper components that inherit all base Vuetify props, integrate with `useDefaults()`, and participate in the Vuetify defaults/theming system.

---

## Architecture: How We Extend Vuetify (The Official Way)

### Extension Strategy

Vuetify 3 does **not** expose a `defineComponent` extension API like Vuetify 2's `extend()`. The official approach for Vuetify 3 is:

1. **Wrapper Components** — Create new components that wrap Vuetify's `VDatePicker` / `VDateInput` internally
2. **Prop Inheritance** — Import and extend the TypeScript prop types from `vuetify/components/VDatePicker`
3. **`useDefaults()` Integration** — Register custom components in Vuetify's global defaults system so consumers can configure them via `createVuetify({ defaults: { VAdvancedDateInput: { ... } } })`
4. **Composable-Driven Logic** — Use Vuetify's `useDate()`, `useDisplay()`, `useLocale()`, `useTheme()` composables alongside custom composables
5. **Plugin Registration** — Ship as a Vue plugin with `install()` that registers components globally

### Component Hierarchy

```
VAdvancedDateInput (top-level — input + popup)
├── VTextField (from Vuetify — the text input / activator)
├── VMenu (desktop) OR VDialog[fullscreen] (mobile) — via useFullscreen()
│   └── VAdvancedDatePicker (the enhanced picker panel)
│       ├── [fullscreen] Top bar: title + close + apply
│       ├── VAdvancedDatePresets
│       │   ├── [desktop] Vertical sidebar list (left of calendar)
│       │   └── [mobile]  Horizontal scrollable chip row (top of calendar)
│       ├── VAdvancedDateHeader (month/year nav — year menu can be disabled)
│       ├── VAdvancedDateMonth (×N — one per visible month)
│       │   └── Uses VDatePicker internally or renders custom grid
│       └── [fullscreen] Bottom action bar: cancel + apply (sticky)
```

### Why Wrapper Over Fork

- **Forward compatibility** — Vuetify updates to VDatePicker (bug fixes, a11y improvements) flow through automatically
- **Smaller bundle** — We don't duplicate Vuetify's date rendering logic
- **Ecosystem consistency** — Themes, locale, RTL, density all work out of the box
- **Less maintenance** — We focus only on the added features

### Key Vuetify Composables We'll Use

| Composable | Purpose |
|---|---|
| `useDefaults(props, 'VAdvancedDateInput')` | Integrate with Vuetify's global defaults system |
| `useDate()` | Date math via Vuetify's adapter (date-fns, luxon, dayjs, etc.) |
| `useDisplay()` | Responsive breakpoints for mobile vs desktop layout |
| `useLocale()` | i18n for month/day names, RTL detection |
| `useTheme()` | Theme-aware colors and dark mode |
| `useProxiedModel()` | Clean v-model handling with internal/external sync |

---

## Feature Specification

### P0 — Must Have (v1.0)

#### 1. Date Range Selection
- Click-to-select start date, click again for end date
- `v-model` binding as `[Date, Date]` tuple or `{ start: Date, end: Date }` object
- Visual range highlight between start and end dates
- Hover preview: as user hovers after selecting start, highlight the tentative range
- Clicking a third time resets and starts a new range

#### 2. Multi-Month Display
- `months` prop (default: `2`) — show N months side by side
- Linked navigation: arrow buttons advance all visible months together
- Responsive: stacks vertically on mobile (`useDisplay().mobile`)
- Consistent 6-week row display to prevent height jumping

#### 3. Predefined Date Ranges Sidebar
- `presets` prop accepting `PresetRange[]`:
  ```ts
  interface PresetRange {
    label: string
    value: [Date, Date] | (() => [Date, Date])
    slot?: string // named slot for custom rendering
  }
  ```
- Default built-in presets: Today, Yesterday, Last 7 Days, Last 30 Days, This Month, Last Month, This Quarter, Last Quarter, Year to Date, Last Year
- Sidebar renders to the left of the calendar grid(s)
- Clicking a preset immediately highlights the range on the calendar and updates the model
- `show-presets` prop (default: `true`) to toggle visibility

#### 4. Swipe Navigation (Mobile)
- Swipe left → next month(s), swipe right → previous month(s)
- Vanilla JS touch event handling (no dependency on Hammer.js)
- Minimum swipe threshold: 50px horizontal, with velocity detection
- `touch-action: pan-y` on calendar container to preserve vertical scrolling
- `swipeable` prop (default: `true`) to enable/disable

#### 5. Text Input with Date Parsing
- Wraps `VTextField` for typed date input
- Parses common formats via the configured date adapter
- Shows formatted date range as "MMM DD, YYYY – MMM DD, YYYY" (configurable)
- Input validation with error states

#### 6. Keyboard Accessibility
- Arrow key navigation within calendar grid (WAI-ARIA grid pattern)
- Enter/Space to select dates
- Escape to close popup
- Tab to move between sidebar presets, calendar, and action buttons
- `aria-live` region for month/year announcements
- `aria-selected` on selected range dates

#### 7. Disable Year Menu in Header
- `hide-year-menu` prop (default: `false`) — prevents the year dropdown/overlay from opening
- When enabled, the header shows the month + year as **static text** (not clickable)
- Year navigation is still possible via month arrow buttons (user scrolls month-by-month)
- Useful when the picker is scoped to a narrow date window and jumping to arbitrary years would be confusing or undesirable
- The month name remains clickable for month-picker view (unless separately disabled)
- Also applies in multi-month mode: all headers lose the year menu simultaneously

#### 8. Fullscreen Mode (Mobile)
- `fullscreen` prop: `boolean | 'auto'` (default: `'auto'`)
  - `true` — always render the picker as a fullscreen `VDialog` (no VMenu)
  - `false` — never fullscreen, always use VMenu popover
  - `'auto'` — fullscreen on mobile breakpoints (`xs`, `sm`), popover on `md`+
- Fullscreen layout specifics:
  - Picker fills the entire viewport via `VDialog fullscreen`
  - **Fixed top bar** with title ("Select date range"), a close/X button, and an Apply button
  - **Presets** render as a horizontal scrollable chip row pinned below the top bar (not a sidebar — saves vertical space)
  - **Calendar months** stack vertically in a scrollable container (single column, swipeable)
  - **Bottom action bar** with Cancel / Apply buttons (sticky, always visible)
  - Smooth CSS transitions between months on swipe (translateX with ease-out)
- Touch optimizations in fullscreen:
  - Larger tap targets: day cells expand to 44×44px minimum (Apple HIG touch target)
  - Swipe gesture area covers the entire calendar container
  - Momentum-based scroll for vertical month list
  - Haptic feedback hint via CSS `touch-action` tuning (no browser scroll fighting)
- Transition: opening the picker uses a bottom-sheet slide-up animation on mobile, standard fade on desktop

### P1 — Should Have (v1.1)

#### 9. Auto-Apply vs Confirm Mode
- `auto-apply` prop (default: `true`) — range applies on second click
- When `false`, show Cancel/Apply action buttons at the bottom
- Action buttons slot for custom rendering

#### 10. Min/Max Date Constraints
- `min` and `max` props — dates outside the range are visually disabled
- Disabled dates cannot be selected or hovered
- Navigation prevents going beyond months that are entirely out of range

#### 11. Allowed/Disabled Dates
- `allowed-dates` prop — function `(date: Date) => boolean`
- Disabled dates show with reduced opacity, no hover effect, not selectable

#### 12. Week Numbers
- `show-week-numbers` prop (default: `false`)
- ISO week numbers displayed as first column

#### 13. Single Date Mode
- `range` prop (default: `true`) — when `false`, behaves as enhanced single date picker
- All other features (multi-month, presets, swipe) still work

#### 14. Inline Mode
- `inline` prop (default: `false`) — render picker directly without popup/input
- Useful for embedding in dashboards

### P2 — Nice to Have (v1.2+)

#### 15. Comparison Mode
- `comparison` prop — enable period-over-period comparison
- Shows two overlapping ranges with distinct colors
- "Compare with previous period" / "Compare with same period last year" options

#### 16. Month/Quarter/Year Picker Modes
- `view-mode` prop: `'date' | 'month' | 'quarter' | 'year'`
- Picker grid adapts to show months, quarters, or years instead of days

#### 17. Date Markers/Events
- `markers` prop — `Array<{ date: Date, color: string, tooltip?: string }>`
- Small dots beneath dates that have associated events

#### 18. Custom First Day of Week
- `first-day-of-week` prop (default: locale-dependent)
- 0 = Sunday, 1 = Monday, etc.

#### 19. Custom Sidebar Slots
- `sidebar-left` and `sidebar-right` named slots
- Allows consumers to inject arbitrary content alongside the calendar

---

## Project Structure

```
vuetify-date-input-advanced/
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── vite.config.ts                    # Library build config
├── vitest.config.ts                  # Test config
├── .eslintrc.cjs
├── .prettierrc
├── LICENSE
├── PLAN.md
│
├── src/
│   ├── index.ts                      # Plugin entry: install(), component exports
│   ├── plugin.ts                     # createAdvancedDateInput() plugin factory
│   │
│   ├── components/
│   │   ├── VAdvancedDateInput/
│   │   │   ├── VAdvancedDateInput.vue      # Top-level: input + popup
│   │   │   ├── VAdvancedDateInput.sass     # Scoped styles (BEM, Vuetify-style)
│   │   │   └── index.ts                    # Re-export + prop types
│   │   │
│   │   ├── VAdvancedDatePicker/
│   │   │   ├── VAdvancedDatePicker.vue     # Core picker panel
│   │   │   ├── VAdvancedDatePicker.sass
│   │   │   └── index.ts
│   │   │
│   │   ├── VAdvancedDatePresets/
│   │   │   ├── VAdvancedDatePresets.vue    # Sidebar presets list
│   │   │   ├── VAdvancedDatePresets.sass
│   │   │   └── index.ts
│   │   │
│   │   ├── VAdvancedDateHeader/
│   │   │   ├── VAdvancedDateHeader.vue    # Month/year navigation
│   │   │   ├── VAdvancedDateHeader.sass
│   │   │   └── index.ts
│   │   │
│   │   └── VAdvancedDateMonth/
│   │       ├── VAdvancedDateMonth.vue     # Single month grid
│   │       ├── VAdvancedDateMonth.sass
│   │       └── index.ts
│   │
│   ├── composables/
│   │   ├── useAdvancedDate.ts        # Date range logic, selection state machine
│   │   ├── useSwipe.ts               # Touch swipe detection with velocity + direction lock
│   │   ├── usePresets.ts             # Preset range computation
│   │   ├── useMultiMonth.ts          # Multi-month navigation state + breakpoint clamping
│   │   ├── useHoverPreview.ts        # Range hover preview state
│   │   └── useFullscreen.ts          # Resolves fullscreen prop vs display breakpoint
│   │
│   ├── types/
│   │   ├── index.ts                  # All public type exports
│   │   ├── props.ts                  # Extended prop type definitions
│   │   └── presets.ts                # PresetRange interface
│   │
│   ├── utils/
│   │   ├── dateHelpers.ts            # Pure utility functions
│   │   └── dom.ts                    # DOM helpers (swipe calc, etc.)
│   │
│   └── styles/
│       ├── variables.scss            # CSS custom properties / SASS variables
│       └── main.scss                 # Global styles entry
│
├── playground/                        # Dev environment for testing
│   ├── App.vue
│   ├── main.ts
│   └── vite.config.ts
│
└── tests/
    ├── unit/
    │   ├── VAdvancedDateInput.spec.ts
    │   ├── VAdvancedDatePicker.spec.ts
    │   ├── useAdvancedDate.spec.ts
    │   ├── useSwipe.spec.ts
    │   └── usePresets.spec.ts
    └── e2e/                           # Cypress or Playwright (later)
        └── date-range.spec.ts
```

---

## Tech Stack

| Tool | Purpose |
|---|---|
| **Vue 3.3+** | Framework (peer dependency) |
| **Vuetify 3.4+** | UI framework (peer dependency) |
| **TypeScript 5.x** | Type safety throughout |
| **Vite 5** | Build tool (library mode) |
| **Vitest** | Unit testing |
| **@vue/test-utils** | Component testing |
| **SASS** | Styling (Vuetify convention) |
| **ESLint + Prettier** | Code quality |
| **unbuild or vite library mode** | Package build output (ESM + CJS + types) |

### Peer Dependencies (not bundled)

```json
{
  "peerDependencies": {
    "vue": "^3.3.0",
    "vuetify": "^3.4.0"
  }
}
```

---

## Build Output

Using Vite library mode:

```
dist/
├── vuetify-date-input-advanced.es.js    # ESM bundle
├── vuetify-date-input-advanced.umd.js   # UMD bundle
├── vuetify-date-input-advanced.css       # Extracted styles
├── types/                                # Generated .d.ts files
│   ├── index.d.ts
│   ├── components/...
│   └── composables/...
```

### package.json exports

```json
{
  "name": "vuetify-date-input-advanced",
  "main": "./dist/vuetify-date-input-advanced.umd.js",
  "module": "./dist/vuetify-date-input-advanced.es.js",
  "types": "./dist/types/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/vuetify-date-input-advanced.es.js",
      "require": "./dist/vuetify-date-input-advanced.umd.js",
      "types": "./dist/types/index.d.ts"
    },
    "./styles": "./dist/vuetify-date-input-advanced.css"
  },
  "files": ["dist"],
  "sideEffects": ["*.css", "*.sass", "*.scss"]
}
```

---

## Consumer API (How Users Will Use This Package)

### Installation

```bash
npm install vuetify-date-input-advanced
```

### Plugin Registration

```ts
// main.ts
import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import { VAdvancedDateInput } from 'vuetify-date-input-advanced'
import 'vuetify-date-input-advanced/styles'

const vuetify = createVuetify({
  defaults: {
    // Optional: set global defaults for all instances
    VAdvancedDateInput: {
      months: 2,
      autoApply: true,
      showPresets: true,
    }
  }
})

const app = createApp(App)
app.use(vuetify)
app.component('VAdvancedDateInput', VAdvancedDateInput) // or use plugin
app.mount('#app')
```

### Basic Usage — Date Range with Presets

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

const dateRange = ref<[Date, Date] | null>(null)
</script>
```

### Custom Presets

```vue
<template>
  <v-advanced-date-input
    v-model="dateRange"
    :presets="customPresets"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { PresetRange } from 'vuetify-date-input-advanced'

const dateRange = ref<[Date, Date] | null>(null)

const customPresets: PresetRange[] = [
  {
    label: 'Last 7 Days',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 7)
      return [start, end]
    }
  },
  {
    label: 'Last 30 Days',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 30)
      return [start, end]
    }
  }
]
</script>
```

### Inline Picker (No Input)

```vue
<v-advanced-date-picker
  v-model="dateRange"
  :months="3"
  inline
  show-presets
/>
```

### Single Date Mode

```vue
<v-advanced-date-input
  v-model="singleDate"
  :range="false"
  :months="1"
  :show-presets="false"
/>
```

---

## Implementation Phases

### Phase 1: Project Scaffold
1. Initialize package.json with metadata, peer deps, scripts
2. Set up TypeScript config (tsconfig.json, tsconfig.build.json)
3. Set up Vite in library mode
4. Set up Vitest
5. Set up ESLint + Prettier
6. Create src/ directory structure
7. Create playground/ dev environment
8. Write plugin entry point (src/index.ts, src/plugin.ts)

### Phase 2: Core Components (P0)
1. **VAdvancedDateMonth** — single month calendar grid
   - Renders day cells with proper styling
   - Emits day click/hover events
   - Handles range highlighting (start, end, in-range, hover-preview)
   - Shows adjacent month days
   - 6-week consistent display

2. **VAdvancedDateHeader** — month/year navigation
   - Previous/next month arrows
   - Month + year display (clickable for month/year picker view)
   - Adapts for multi-month (only outer arrows shown)

3. **VAdvancedDatePicker** — main picker panel
   - Renders N months via `VAdvancedDateMonth`
   - Manages multi-month navigation state
   - Integrates hover preview
   - Layout: horizontal (desktop) / vertical (mobile)

4. **VAdvancedDatePresets** — preset ranges sidebar
   - Renders preset list
   - Highlights active preset when current range matches
   - Emits preset selection

5. **VAdvancedDateInput** — top-level component
   - Wraps VTextField for input display
   - VMenu/VDialog for popup
   - Connects everything together
   - v-model handling

### Phase 3: Composables
1. **useAdvancedDate** — range selection state machine
2. **useMultiMonth** — month navigation with N months, clamping based on breakpoint
3. **useHoverPreview** — hover date tracking and range preview
4. **usePresets** — preset computation + active detection
5. **useSwipe** — touch event swipe detection with velocity, rubber-band, and direction locking
6. **useFullscreen** — resolves `fullscreen` prop (`true`/`false`/`'auto'`) against `useDisplay()` breakpoint, returns reactive `isFullscreen` boolean

### Phase 4: Integration & Polish
1. Wire composables into components
2. Integrate with Vuetify's useDefaults(), useDate(), useDisplay(), useLocale()
3. Implement swipe navigation with rubber-band feedback and direction locking
4. Implement fullscreen mode: VDialog, top bar, bottom action bar, preset chips row
5. Implement hideYearMenu: conditionally disable year click handler in VAdvancedDateHeader
6. Add keyboard navigation (arrow keys, enter, escape) + focus trapping in fullscreen
7. Add ARIA attributes, screen reader announcements, and prefers-reduced-motion support
8. Responsive breakpoint handling: month count clamping, layout switching, touch target sizing
9. Theme integration (light/dark)
10. Transition/animation polish: month slide, popup open/close, range highlight, selection pulse

### Phase 5: Testing
1. Unit tests for all composables
2. Component tests for each component
3. Integration test for full date range selection flow
4. Accessibility audit

### Phase 6: Build & Publish Prep
1. Finalize Vite library build config
2. Generate TypeScript declaration files
3. Write minimal README with usage examples
4. Set up npm publish workflow

---

## Props API Reference (VAdvancedDateInput)

| Prop | Type | Default | Description |
|---|---|---|---|
| `modelValue` | `Date \| [Date, Date] \| null` | `null` | Selected date or range |
| `range` | `boolean` | `true` | Enable date range selection |
| `months` | `number` | `2` | Number of months displayed |
| `presets` | `PresetRange[]` | Built-in defaults | Predefined date ranges |
| `showPresets` | `boolean` | `true` | Show preset sidebar |
| `autoApply` | `boolean` | `true` | Apply selection immediately (no confirm button) |
| `min` | `Date \| string` | — | Minimum selectable date |
| `max` | `Date \| string` | — | Maximum selectable date |
| `allowedDates` | `(date: Date) => boolean` | — | Function to control which dates are selectable |
| `inline` | `boolean` | `false` | Render inline (no popup) |
| `showWeekNumbers` | `boolean` | `false` | Display ISO week numbers |
| `sixWeeks` | `boolean \| 'append' \| 'prepend'` | `false` | Force 6-week display |
| `swipeable` | `boolean` | `true` | Enable touch swipe navigation |
| `fullscreen` | `boolean \| 'auto'` | `'auto'` | Fullscreen mode: `true` always, `false` never, `'auto'` on mobile |
| `hideYearMenu` | `boolean` | `false` | Disable the year picker dropdown in the header |
| `format` | `string` | `'MMM DD, YYYY'` | Display format in the text input |
| `separator` | `string` | `' – '` | Separator between start and end dates in input |
| `firstDayOfWeek` | `number` | Locale default | 0=Sun, 1=Mon, etc. |
| `label` | `string` | — | Input label (forwarded to VTextField) |
| `variant` | Vuetify variants | `'outlined'` | Input variant (forwarded to VTextField) |
| `density` | `'default' \| 'comfortable' \| 'compact'` | `'default'` | Density (forwarded to VTextField) |
| `color` | `string` | `'primary'` | Selection color |
| `disabled` | `boolean` | `false` | Disable the component |
| `readonly` | `boolean` | `false` | Readonly mode |

### Events

| Event | Payload | Description |
|---|---|---|
| `update:modelValue` | `Date \| [Date, Date] \| null` | Selection changed |
| `range-start` | `Date` | Start date selected |
| `range-end` | `Date` | End date selected |
| `month-change` | `{ year: number, month: number }` | Visible month changed |
| `preset-select` | `PresetRange` | A preset was clicked |
| `open` | — | Picker popup opened |
| `close` | — | Picker popup closed |

### Slots

| Slot | Scope | Description |
|---|---|---|
| `preset` | `{ preset: PresetRange, active: boolean }` | Custom preset item rendering |
| `day` | `{ date: Date, selected: boolean, inRange: boolean, disabled: boolean }` | Custom day cell |
| `header` | `{ month: number, year: number }` | Custom header |
| `actions` | `{ apply: () => void, cancel: () => void }` | Custom action buttons (when autoApply=false) |
| `sidebar-left` | — | Custom left sidebar content |
| `sidebar-right` | — | Custom right sidebar content |
| `activator` | `{ props: Record<string, any>, isActive: boolean }` | Custom activator replacing the input |

---

## UX Design & Responsiveness

### Responsive Behavior Matrix

The component adapts its layout at every breakpoint using Vuetify's `useDisplay()`:

| Breakpoint | Picker Container | Month Layout | Presets | Month Count Override |
|---|---|---|---|---|
| **xs** (< 600px) | Fullscreen dialog (bottom-sheet slide-up) | Single column, vertical scroll | Horizontal scrollable chip row at top | Forced to `1` |
| **sm** (600–959px) | Fullscreen dialog | Single column, vertical scroll | Horizontal scrollable chip row at top | Forced to `1` |
| **md** (960–1279px) | VMenu popover (anchored to input) | Side-by-side horizontal | Sidebar (left, collapsible) | Up to `2` |
| **lg** (1280–1919px) | VMenu popover | Side-by-side horizontal | Sidebar (left, always visible) | Up to `3` |
| **xl** (1920+) | VMenu popover | Side-by-side horizontal | Sidebar (left, always visible) | As configured |

- The `months` prop is a **maximum** — the component clamps it down based on available space
- `fullscreen="auto"` triggers fullscreen for `xs` and `sm` breakpoints; `fullscreen=true` forces it at all sizes

### Mobile Fullscreen UX (xs/sm)

```
┌──────────────────────────────────┐
│  ← Select date range      Apply  │  ← Fixed top bar
├──────────────────────────────────┤
│ [Last 7d] [Last 30d] [This Mo…] │  ← Horizontal scrollable preset chips
├──────────────────────────────────┤
│                                  │
│        ◀  January 2026  ▶        │  ← Swipeable month header
│  Mo Tu We Th Fr Sa Su            │
│                  1  2  3  4      │
│   5  6  7  8  9 10 11            │
│  12 13 [14 15 16 17] 18          │  ← Selected range
│  19 20  21 22 23 24 25           │
│  26 27  28 29 30 31              │
│                                  │
│        ◀  February 2026  ▶       │  ← Scroll to see next month
│  Mo Tu We Th Fr Sa Su            │
│                        1         │
│   2  3  4  5  6  7  8           │
│  ...                             │
│                                  │  ← Vertically scrollable area
├──────────────────────────────────┤
│      [ Cancel ]    [ Apply ]     │  ← Sticky bottom action bar
└──────────────────────────────────┘
```

- Day cells are **44×44px** minimum (Apple HIG / Material Design touch target)
- Preset chip row uses **horizontal scroll with snap points** (`scroll-snap-type: x mandatory`)
- Active preset chip gets primary color fill; others are outlined
- Bottom bar uses `position: sticky` to stay visible during calendar scroll
- Opening animation: slide up from bottom (300ms ease-out)
- Closing animation: slide down (200ms ease-in)

### Desktop Popover UX (md+)

```
┌─────────────────────────────────────────────────────┐
│ ┌─────────────┐ ┌──────────────────────────────────┐│
│ │  Presets     │ │  ◀  January 2026    February …  ▶││
│ │             │ │  Mo Tu We Th …    Mo Tu We Th …  ││
│ │ ○ Today     │ │                                   ││
│ │ ○ Yesterday │ │   ...              ...            ││
│ │ ● Last 7d   │ │                                   ││
│ │ ○ Last 30d  │ │   [14 15 16 17 18 19 20]         ││
│ │ ○ This Mo.  │ │                                   ││
│ │ ○ Last Mo.  │ │   ...              ...            ││
│ │ ○ This Qtr  │ │                                   ││
│ │ ○ Last Qtr  │ ├──────────────────────────────────┤│
│ │ ○ YTD       │ │  Jan 14, 2026 – Jan 20, 2026    ││
│ │ ○ Last Year │ │           [ Cancel ] [ Apply ]   ││
│ └─────────────┘ └──────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

- VMenu anchored below the VTextField with `location="bottom start"`
- Sidebar width: `180px` (configurable via CSS custom property)
- Active preset uses primary color text + subtle background highlight
- Month grids sit side-by-side with `16px` gap
- Navigation arrows: only the **leftmost ◀** and **rightmost ▶** are shown (inner boundaries between months have no arrows)
- Popover has subtle box shadow and rounded corners matching Vuetify elevation
- Max height constrained; if calendar overflows, the month area scrolls internally

### Interaction Polish

#### Hover Preview (Desktop)
- After selecting a start date, hovering over any other date shows the **tentative range** with a light background fill (`--v-advanced-date-range-hover-bg`)
- The hovered date gets a circular outline (not filled — to distinguish from the confirmed selection)
- Range preview updates on every `mousemove` for instant visual feedback
- If hovering before the start date, the range extends backward (start date shifts, not end date) — users don't have to pick chronologically

#### Selection Feedback
- Day cell on click: brief **scale pulse animation** (scale 0.85 → 1.0, 150ms) to confirm the tap registered
- Start date: filled circle with primary color
- End date: filled circle with primary color
- In-range dates: light primary background fill spanning edge-to-edge (no gap between cells) to create a continuous "band"
- Range band has **rounded caps** only on the start/end cells; middle cells use flat edges for visual continuity

#### Transitions & Animations
- **Month navigation**: calendar grid slides left/right (200ms ease-out `transform: translateX`) — not an abrupt swap
- **Popup open/close**: desktop uses Vuetify's standard menu transition (`v-fade-transition`); mobile uses custom bottom-sheet slide (`v-slide-y-reverse-transition`)
- **Preset selection**: range highlight animates smoothly when switching presets (CSS transition on background-color, 150ms)
- **Month count change** (responsive resize): months fade in/out with `v-expand-x-transition`
- No animation when `prefers-reduced-motion: reduce` is set — respects OS accessibility setting

#### Swipe Gesture Details
- **Threshold**: 50px horizontal distance AND velocity > 0.3px/ms (prevents accidental swipes during scroll)
- **Visual feedback during swipe**: calendar translates with finger position (rubber-band effect), then snaps to next/previous month or springs back
- **Momentum**: if velocity > 1.0px/ms, skip ahead by 2 months
- **Vertical lock**: once a vertical scroll is detected (deltaY > deltaX within first 10px), the swipe gesture is canceled — no scroll/swipe fighting
- **Edge bounce**: at min/max month boundaries, a subtle rubber-band overscroll indicates "you can't go further"

#### Smart Defaults for Quick UX
- When opening the picker with no value, show **current month** (and next month if `months >= 2`)
- When opening with an existing range, center the view so the **start date's month is the leftmost** visible month
- If the existing range spans more months than are visible, show the start date's month
- Pressing **Escape** closes the picker **without applying** uncommitted changes (if `autoApply=false`)
- Pressing **Enter** applies the current selection and closes
- Clicking outside the popover applies (if `autoApply=true`) or cancels (if `autoApply=false`)

### Accessibility (WCAG 2.1 AA)

- **Focus management**: when popup opens, focus moves to the calendar grid; when it closes, focus returns to the input
- **Focus trapping**: in fullscreen mode, Tab cycles within the dialog (doesn't escape to background content)
- **Screen reader announcements**: `aria-live="polite"` region announces "January 2026" when month changes, "Selected range: Jan 14 to Jan 20" when range is confirmed
- **Color contrast**: all text meets 4.5:1 contrast ratio; range highlight meets 3:1 against background
- **Touch target sizing**: minimum 44×44px on all interactive elements in fullscreen mode, 36×36px in popover mode
- **Keyboard-only operation**: every action achievable by mouse is achievable by keyboard
- **`prefers-reduced-motion`**: all animations disabled when OS setting is active

---

## CSS Custom Properties

```scss
// Consumers can override these for customization
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
```

---

## Decisions & Trade-offs

| Decision | Choice | Rationale |
|---|---|---|
| Wrapper vs Fork | **Wrapper** | Forward-compatible, smaller bundle, easier maintenance |
| Swipe library | **Vanilla JS** | Zero additional dependencies; simple touch math is sufficient |
| Styling approach | **SASS + CSS custom properties** | Matches Vuetify conventions; customizable via CSS vars |
| Date library | **Vuetify's date adapter** | Users already configure their date library with Vuetify; we piggyback on it |
| Build tool | **Vite library mode** | Standard for Vue 3 libs, tree-shakeable ESM output |
| Range model format | **`[Date, Date]` tuple** | Simple, works with Vuetify's existing date adapter, easy to destructure |
| Component file format | **`.vue` SFC** | Standard Vue developer experience; `.tsx` reserved for complex render logic |

---

## Open Questions (for later)

- Should we support Nuxt module auto-import?
- Should we provide a headless/unstyled mode?
- Do we need SSR compatibility considerations?
- Should we publish to npm under a scope (@yourname/vuetify-date-input-advanced)?
