# vuetify-date-input-advanced - Project Plan (Vuetify 4)

## Overview

A Vuetify 4 plugin package that extends `VDateInput` and `VDatePicker` with advanced features: multi-month display, swipe navigation, predefined date ranges sidebar, date range selection with hover preview, and responsive mobile support.

The package ships as a Vue 3 plugin that registers components into the Vuetify ecosystem using the **official extension pattern** — wrapper components that inherit all base Vuetify props, integrate with `useDefaults()`, and participate in the Vuetify defaults/theming system.

---

## Vuetify 4 — What Changed and How We Leverage It

### Native Range Support in VDatePicker & VDateInput

Vuetify 4 ships `VDatePicker` and `VDateInput` with **native range selection** via `multiple="range"`. This is a game-changer — in v3 we would have needed to build range selection from scratch. In v4:

- `VDatePicker` with `multiple="range"` handles click-to-select start/end dates natively
- Range picker **only emits start and end values** (not intermediate states) — cleaner API
- `VDateInput` wraps `VDatePicker` with a text field, menu, mobile dialog, cancel/ok buttons, and `displayFormat` / `inputFormat` support

**Impact on our strategy**: We no longer need to build core range selection logic or the input+menu wiring from scratch. Instead, we **extend** the native components, adding the features Vuetify doesn't provide: multi-month, presets, swipe, hover preview, and enhanced fullscreen UX.

### Key v4 API Additions We'll Use

| Feature | API | How We Use It |
|---|---|---|
| Range selection | `multiple="range"` on VDatePicker/VDateInput | Core range behavior — we wrap, not reimplement |
| Control variants | `controlVariant="docked" \| "modal"` | Choose header layout style; `"modal"` gives month+year together with arrows |
| No month picker | `noMonthPicker` prop | Combine with `controlVariant="modal"` to disable month jumping (our `hideYearMenu` equivalent) |
| Mobile mode | `mobile` prop + `mobileBreakpoint` on VDateInput | Native mobile detection; we layer fullscreen UX on top |
| Hide actions | `hideActions` on VDateInput | Maps to our `autoApply` concept |
| Picker props pass-through | `pickerProps` on VDateInput | Forward props that conflict between text field and picker (color, width, rounded) |
| Display format | `displayFormat` on VDateInput | Format shown in the text input |
| Input format | `inputFormat` on VDateInput | Format for manual typing (e.g., `'yyyy-mm-dd'`) |
| Update on | `updateOn` on VDateInput | Controls when typed input updates the model (`'blur'`, `'enter'`) |
| Events/markers | `events` + `eventColor` on VDatePicker | Date markers/dots — we expose this as a pass-through |
| Allowed dates | `allowedDates`, `allowedMonths`, `allowedYears` | Date constraints — native, we pass through |
| Week numbers | `showWeek` on VDatePicker | Native week numbers |
| Weeks in month | `weeksInMonth="static"` | Consistent 6-row display (prevents height jumping) |
| Controls slot | `#controls` slot on VDatePicker | Full access to month/year navigation for custom header |
| Day slot | `#day` slot on VDatePicker | Custom day cell rendering for hover preview overlay |
| Actions slot | `#actions` slot on VDatePicker/VDateInput | Custom action buttons |
| Cancel/OK text | `cancelText` / `okText` on VDateInput | Localized button labels |

### v4 Breaking Changes That Affect Us

| Change | Impact |
|---|---|
| **CSS Layers mandatory** | All our styles must be in appropriate `@layer` blocks |
| **Default theme = "system"** | Our theming must work with light, dark, and system |
| **Reduced breakpoints** (md: 840px, lg: 1145px, xl: 1545px) | Update responsive behavior matrix |
| **MD3 typography** | Use new variant names (display-*, headline-*, body-*, label-*) |
| **MD3 elevation** (0-5 levels) | Use levels 0-5 instead of 0-24 |
| **Grid uses CSS gap** | Our layout must use gap-based spacing, not padding/margin hacks |
| **Theme transparency** | Use `color-mix()` instead of `rgba(var(--v-theme-*), opacity)` |
| **`undefined` skipped in defaults** | Use `null` explicitly to override global defaults |
| **VBtn: no uppercase, flex layout** | Our action buttons inherit this naturally |

---

## Architecture: Extension Strategy for Vuetify 4

### Why Extend, Not Fork

Vuetify 4's `VDateInput` and `VDatePicker` now handle the hard parts:
- Range selection state machine (`multiple="range"`)
- Input + popup wiring (VMenu on desktop, VDialog on mobile)
- Date formatting and parsing (`displayFormat`, `inputFormat`)
- Date adapter integration (`useDate()`)
- Locale, RTL, theming
- Keyboard accessibility basics
- Cancel/OK confirmation flow

**We add what's missing:**
1. Multi-month display (N months side by side)
2. Preset date ranges sidebar
3. Touch swipe navigation
4. Hover preview for range selection
5. Enhanced fullscreen mobile UX
6. Hide year/month picker controls

### Component Hierarchy

```
VAdvancedDateInput (top-level — wraps VDateInput or renders standalone)
├── VDateInput (from Vuetify — handles input + popup wiring)
│   └── Customized via slots and pickerProps:
│       └── VAdvancedDatePicker (replaces default picker content)
│           ├── [fullscreen] Top bar: title + close + apply
│           ├── VAdvancedDatePresets
│           │   ├── [desktop] Vertical sidebar list (left of calendar)
│           │   └── [mobile]  Horizontal scrollable chip row (top of calendar)
│           ├── Multi-month container
│           │   ├── VAdvancedDateHeader (shared navigation — prev/next for all months)
│           │   └── VDatePicker (×N — one per visible month, each with multiple="range")
│           │       └── Uses #day slot for hover preview overlay
│           └── [fullscreen] Bottom action bar: cancel + apply (sticky)
```

### Alternative: Direct VDatePicker Composition (Preferred)

After analyzing the VDateInput API more closely, the cleanest approach is:

```
VAdvancedDateInput (top-level)
├── VTextField (activator — displays formatted range text)
├── VMenu (desktop) OR VDialog[fullscreen] (mobile)
│   └── VAdvancedDatePicker (our enhanced picker panel)
│       ├── VAdvancedDatePresets (sidebar / chip row)
│       ├── VAdvancedDateHeader (shared multi-month navigation)
│       │   └── Uses controlVariant="modal" or custom controls
│       ├── VDatePicker ×N (each showing one month)
│       │   ├── hideHeader (we provide our own shared header)
│       │   ├── multiple="range"
│       │   ├── weeksInMonth="static"
│       │   ├── #day slot → hover preview + custom range highlighting
│       │   └── Synced month/year via :month and :year props
│       └── Action buttons (when autoApply=false)
```

**Rationale**: Composing multiple `VDatePicker` instances (one per visible month) with synced `month`/`year` props gives us full multi-month control while inheriting all of Vuetify's rendering, accessibility, and theming per-month. We hide each picker's individual header and render our own shared navigation header.

### Key Vuetify 4 Composables We'll Use

| Composable | Purpose |
|---|---|
| `useDefaults(props, 'VAdvancedDateInput')` | Integrate with Vuetify's global defaults system |
| `useDate()` | Date math via Vuetify's adapter (date-fns, luxon, dayjs, native) |
| `useDisplay()` | Responsive breakpoints — v4 reduced thresholds |
| `useLocale()` | i18n for month/day names, RTL detection |
| `useTheme()` | Theme-aware colors and dark mode (system default in v4) |

### Plugin Registration with Aliases

Vuetify 4's aliasing system lets us register virtual components:

```ts
import { createVuetify } from 'vuetify'
import { VAdvancedDateInput, VAdvancedDatePicker } from '@gigerit/vuetify-date-input-advanced'

const vuetify = createVuetify({
  aliases: {
    VAdvancedDateInput,
    VAdvancedDatePicker,
  },
  defaults: {
    VAdvancedDateInput: {
      months: 2,
      showPresets: true,
    },
  },
})
```

---

## Feature Specification

### P0 — Must Have (v1.0)

#### 1. Date Range Selection (Native + Enhanced)
- Leverages `VDatePicker` with `multiple="range"` — Vuetify handles core selection
- `v-model` binding as `unknown[]` (Vuetify's native format — adapter-dependent dates)
- Also supports `[Date, Date]` tuple and `{ start: Date, end: Date }` via model modifiers
- **Hover preview** (our addition): as user hovers after selecting start, highlight the tentative range via the `#day` slot
- Clicking a third time resets and starts a new range (native behavior)

#### 2. Multi-Month Display
- `months` prop (default: `2`) — show N `VDatePicker` instances side by side
- Each picker instance gets `hideHeader` — we render a shared `VAdvancedDateHeader`
- Linked navigation: arrow buttons advance all visible months together via synced `:month` / `:year` props
- Responsive: stacks vertically on mobile (`useDisplay().mobile`)
- Each picker uses `weeksInMonth="static"` to prevent height jumping
- All pickers share the same `modelValue` so range highlighting spans across months

#### 3. Predefined Date Ranges Sidebar
- `presets` prop accepting `PresetRange[]`:
  ```ts
  interface PresetRange {
    label: string
    value: [unknown, unknown] | (() => [unknown, unknown])
    slot?: string // named slot for custom rendering
  }
  ```
- Default built-in presets: Today, Yesterday, Last 7 Days, Last 30 Days, This Month, Last Month, This Quarter, Last Quarter, Year to Date, Last Year
- Sidebar renders to the left of the calendar grid(s) on desktop
- Clicking a preset immediately highlights the range on the calendar and updates the model
- `show-presets` prop (default: `true`) to toggle visibility
- Active preset detection: highlights the preset whose range matches current selection

#### 4. Swipe Navigation (Mobile)
- Swipe left → next month(s), swipe right → previous month(s)
- Vanilla JS touch event handling (no dependency on Hammer.js)
- Minimum swipe threshold: 50px horizontal, with velocity detection
- `touch-action: pan-y` on calendar container to preserve vertical scrolling
- `swipeable` prop (default: `true`) to enable/disable

#### 5. Text Input with Date Parsing
- Wraps native `VDateInput` or `VTextField` with date parsing
- Uses `displayFormat` for display and `inputFormat` for manual input (Vuetify 4 native)
- Shows formatted date range as configurable format (e.g., "Jan 14, 2026 – Jan 20, 2026")
- `updateOn` pass-through: controls when typed input updates model (`['blur', 'enter']` default)
- Input validation with error states via Vuetify's `rules` prop

#### 6. Keyboard Accessibility
- Arrow key navigation within calendar grid (WAI-ARIA grid pattern) — inherits from VDatePicker
- Enter/Space to select dates — native
- Escape to close popup
- Tab to move between sidebar presets, calendar, and action buttons
- `aria-live` region for month/year announcements on navigation
- `aria-selected` on selected range dates — enhanced via `#day` slot

#### 7. Disable Year/Month Menu in Header
- `hideYearMenu` prop (default: `false`)
- Maps to VDatePicker's `noMonthPicker` when using `controlVariant="modal"`
- When enabled, header shows month + year as **static text** (not clickable)
- Year navigation still possible via month arrow buttons
- Also applies in multi-month mode: all headers lose the year menu simultaneously

#### 8. Fullscreen Mode (Mobile)
- `fullscreen` prop: `boolean | 'auto'` (default: `'auto'`)
  - `true` — always render as fullscreen `VDialog`
  - `false` — never fullscreen, always use VMenu popover
  - `'auto'` — fullscreen on mobile (uses `useDisplay().mobile` with v4's reduced breakpoints)
- Fullscreen layout:
  - Picker fills entire viewport via `VDialog fullscreen`
  - **Fixed top bar** with title ("Select date range"), close/X button, and Apply button
  - **Presets** render as horizontal scrollable chip row pinned below top bar
  - **Calendar months** stack vertically in scrollable container
  - **Bottom action bar** with Cancel / Apply buttons (sticky)
  - Smooth CSS transitions between months on swipe
- Touch optimizations in fullscreen:
  - Larger tap targets: day cells 44×44px minimum (Apple HIG)
  - Swipe gesture area covers entire calendar container
  - Momentum-based scroll for vertical month list
- Transition: bottom-sheet slide-up on mobile, standard fade on desktop

### P1 — Should Have (v1.1)

#### 9. Auto-Apply vs Confirm Mode
- `autoApply` prop (default: `true`) — range applies on second click
- Maps to `hideActions` on the underlying VDateInput/VDatePicker
- When `false`, show Cancel/Apply action buttons via `#actions` slot
- `cancelText` and `okText` props for localization (pass-through to Vuetify)

#### 10. Min/Max Date Constraints
- `min` and `max` props — pass-through to VDatePicker (ISO 8601 format)
- Disabled dates cannot be selected or hovered
- Navigation prevents going beyond months entirely out of range

#### 11. Allowed/Disabled Dates
- `allowedDates` prop — pass-through to VDatePicker
- Also supports `allowedMonths` and `allowedYears` (new in v4)
- Disabled dates show with reduced opacity, no hover effect

#### 12. Week Numbers
- `showWeek` prop (default: `false`) — pass-through to VDatePicker
- ISO week numbers displayed as first column

#### 13. Single Date Mode
- `range` prop (default: `true`) — when `false`, uses `multiple=false` on VDatePicker
- All other features (multi-month, presets, swipe) still work

#### 14. Inline Mode
- `inline` prop (default: `false`) — render VAdvancedDatePicker directly without popup/input
- Useful for embedding in dashboards

### P2 — Nice to Have (v1.2+)

#### 15. Comparison Mode
- `comparison` prop — enable period-over-period comparison
- Shows two overlapping ranges with distinct colors via `#day` slot styling
- "Compare with previous period" / "Compare with same period last year" options

#### 16. Month/Quarter/Year Picker Modes
- `viewMode` prop: `'month' | 'months' | 'year'` — pass-through to VDatePicker's `viewMode`
- Picker grid adapts to show months or years instead of days

#### 17. Date Markers/Events
- `events` prop — pass-through to VDatePicker's native `events` prop
- `eventColor` prop — pass-through to VDatePicker's `eventColor`
- Small dots beneath dates that have associated events (native v4 feature)

#### 18. Custom First Day of Week
- `firstDayOfWeek` prop — pass-through to VDatePicker (native)
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
├── eslint.config.mjs                 # Flat config (ESLint 9+)
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
│   │   │   ├── VAdvancedDateInput.sass     # Scoped styles (in @layer)
│   │   │   └── index.ts                    # Re-export + prop types
│   │   │
│   │   ├── VAdvancedDatePicker/
│   │   │   ├── VAdvancedDatePicker.vue     # Core picker panel (multi-month + presets)
│   │   │   ├── VAdvancedDatePicker.sass
│   │   │   └── index.ts
│   │   │
│   │   ├── VAdvancedDatePresets/
│   │   │   ├── VAdvancedDatePresets.vue    # Sidebar presets list / chip row
│   │   │   ├── VAdvancedDatePresets.sass
│   │   │   └── index.ts
│   │   │
│   │   └── VAdvancedDateHeader/
│   │       ├── VAdvancedDateHeader.vue    # Shared multi-month navigation
│   │       ├── VAdvancedDateHeader.sass
│   │       └── index.ts
│   │
│   ├── composables/
│   │   ├── useAdvancedDate.ts        # Range normalization, preset matching, model bridging
│   │   ├── useSwipe.ts               # Touch swipe detection with velocity + direction lock
│   │   ├── usePresets.ts             # Preset range computation + active detection
│   │   ├── useMultiMonth.ts          # Multi-month navigation state + breakpoint clamping
│   │   ├── useHoverPreview.ts        # Range hover preview state (works with #day slot)
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
│       └── main.scss                 # Global styles entry (with @layer declarations)
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
    └── e2e/                           # Playwright
        └── date-range.spec.ts
```

**Note**: `VAdvancedDateMonth` from the v3 plan is **removed** — we use `VDatePicker` instances directly (one per visible month), each with `hideHeader` and synced `month`/`year` props. This eliminates an entire component and all its rendering logic.

---

## Tech Stack

| Tool | Purpose |
|---|---|
| **Vue 3.5+** | Framework (peer dependency) |
| **Vuetify 4.x** | UI framework (peer dependency) |
| **TypeScript 5.x** | Type safety throughout |
| **Vite 6** | Build tool (library mode) |
| **Vitest 2** | Unit testing |
| **@vue/test-utils 2** | Component testing |
| **SASS** | Styling (Vuetify convention, with `@layer` blocks) |
| **ESLint 9 + Prettier** | Code quality (flat config) |

### Peer Dependencies (not bundled)

```json
{
  "peerDependencies": {
    "vue": "^3.5.0",
    "vuetify": "^4.0.0"
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
├── vuetify-date-input-advanced.css       # Extracted styles (with @layer)
├── types/                                # Generated .d.ts files
│   ├── index.d.ts
│   ├── components/...
│   └── composables/...
```

### package.json exports

```json
{
  "name": "@gigerit/vuetify-date-input-advanced",
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
npm install @gigerit/vuetify-date-input-advanced
```

### Plugin Registration

```ts
// main.ts
import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import { VAdvancedDateInput, VAdvancedDatePicker } from '@gigerit/vuetify-date-input-advanced'
import '@gigerit/vuetify-date-input-advanced/styles'

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
app.component('VAdvancedDateInput', VAdvancedDateInput)
app.component('VAdvancedDatePicker', VAdvancedDatePicker)
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

const dateRange = ref<unknown[] | null>(null)
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
import { useDate } from 'vuetify'
import type { PresetRange } from '@gigerit/vuetify-date-input-advanced'

const date = useDate()
const dateRange = ref<unknown[] | null>(null)

const customPresets: PresetRange[] = [
  {
    label: 'Last 7 Days',
    value: () => {
      const end = date.date()!
      const start = date.addDays(end, -7)
      return [start, end]
    }
  },
  {
    label: 'Last 30 Days',
    value: () => {
      const end = date.date()!
      const start = date.addDays(end, -30)
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

### With Date Events/Markers (v4 Native)

```vue
<v-advanced-date-input
  v-model="dateRange"
  :events="['2026-01-15', '2026-01-20', '2026-02-03']"
  event-color="warning"
/>
```

### With Allowed Dates Constraints

```vue
<v-advanced-date-input
  v-model="dateRange"
  :allowed-dates="(date) => !isWeekend(date)"
  :allowed-months="[0, 1, 2, 3, 4, 5]"
  min="2026-01-01"
  max="2026-12-31"
/>
```

---

## Implementation Phases

### Phase 1: Project Scaffold
1. Initialize package.json with metadata, peer deps (`vue ^3.5`, `vuetify ^4.0`), scripts
2. Set up TypeScript config (tsconfig.json, tsconfig.build.json)
3. Set up Vite 6 in library mode with `vite-plugin-vuetify`
4. Set up Vitest
5. Set up ESLint 9 flat config + Prettier
6. Create src/ directory structure
7. Create playground/ dev environment (Vuetify 4 app)
8. Write plugin entry point (src/index.ts, src/plugin.ts)
9. Configure CSS layer ordering in styles/main.scss:
   ```scss
   @layer vuetify-core, vuetify-components, vuetify-advanced-date, vuetify-overrides;
   ```

### Phase 2: Core Components (P0)

1. **VAdvancedDateHeader** — shared multi-month navigation
   - Previous/next month arrows (linked across N months)
   - Month + year display for each visible month
   - `hideYearMenu` support via static text rendering
   - Adapts for multi-month: only outer arrows shown
   - Uses VDatePicker's `#controls` slot data pattern for consistency

2. **VAdvancedDatePicker** — main picker panel
   - Renders N `VDatePicker` instances, each with:
     - `hideHeader` (our shared header replaces individual ones)
     - `multiple="range"`
     - `weeksInMonth="static"`
     - Synced `:month` and `:year` props (offset per instance)
   - All pickers share the same `modelValue` for cross-month range highlighting
   - Layout: horizontal `display: flex` with `gap` (desktop) / vertical stack (mobile)
   - Integrates hover preview via `#day` slot on each picker

3. **VAdvancedDatePresets** — preset ranges sidebar / chip row
   - Desktop: vertical sidebar list with VList items
   - Mobile: horizontal scrollable VChipGroup
   - Highlights active preset when current range matches
   - Emits preset selection event

4. **VAdvancedDateInput** — top-level component
   - Wraps VTextField as activator
   - VMenu (desktop) or VDialog fullscreen (mobile) for popup
   - Connects VAdvancedDatePicker + VAdvancedDatePresets
   - v-model handling with format display
   - `useDefaults()` integration for global configuration
   - Pass-through of all relevant VDateInput/VDatePicker props

### Phase 3: Composables

1. **useAdvancedDate** — model bridging and range normalization
   - Converts between user-facing model format and VDatePicker's internal format
   - Handles `useDate()` adapter-agnostic date operations
   - Range validation (start <= end normalization)

2. **useMultiMonth** — month navigation with N months
   - Tracks base month/year for leftmost picker
   - Computes offsets for each picker instance
   - Clamps month count based on breakpoint via `useDisplay()`
   - Prevents navigation beyond min/max boundaries

3. **useHoverPreview** — hover date tracking and range preview
   - Tracks mouse position over day cells via `#day` slot
   - Computes tentative range between start date and hovered date
   - Returns CSS class computation for each day cell
   - Handles backward selection (hover before start)

4. **usePresets** — preset computation + active detection
   - Evaluates lazy preset values (functions) on access
   - Compares current model value against each preset for active state
   - Uses `useDate()` for adapter-agnostic comparison

5. **useSwipe** — touch swipe detection
   - Velocity-based with direction locking
   - Rubber-band overscroll at boundaries
   - Integrates with useMultiMonth for month advancement

6. **useFullscreen** — resolves fullscreen prop against display
   - `true` → always fullscreen
   - `false` → never fullscreen
   - `'auto'` → fullscreen when `useDisplay().mobile` is true
   - Returns reactive `isFullscreen` boolean

### Phase 4: Integration & Polish
1. Wire composables into components
2. Integrate with Vuetify's `useDefaults()`, `useDate()`, `useDisplay()`, `useLocale()`
3. Implement swipe navigation with rubber-band feedback and direction locking
4. Implement fullscreen mode: VDialog, top bar, bottom action bar, preset chips row
5. Implement `hideYearMenu`: conditionally set `noMonthPicker` + hide year click handler
6. Add keyboard navigation enhancements + focus trapping in fullscreen
7. Add ARIA attributes, screen reader announcements, and `prefers-reduced-motion` support
8. Responsive breakpoint handling with v4's reduced thresholds
9. Theme integration (light/dark/system — v4 default is system)
10. Transition/animation polish: month slide, popup open/close, range highlight
11. CSS layer compliance: all styles in `@layer vuetify-advanced-date`

### Phase 5: Testing
1. Unit tests for all composables
2. Component tests for each component (using `@vue/test-utils` with Vuetify 4)
3. Integration test for full date range selection flow
4. Test with different date adapters (native, date-fns, dayjs, luxon)
5. Accessibility audit (axe-core)
6. Test all three theme modes (light, dark, system)

### Phase 6: Build & Publish Prep
1. Finalize Vite library build config with `@layer` CSS output
2. Generate TypeScript declaration files
3. Write minimal README with usage examples
4. Set up npm publish workflow

---

## Props API Reference (VAdvancedDateInput)

### Our Custom Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `modelValue` | `unknown \| unknown[] \| null` | `null` | Selected date or range (adapter-dependent type) |
| `range` | `boolean` | `true` | Enable date range selection (`multiple="range"` on picker) |
| `months` | `number` | `2` | Number of months displayed (clamped by breakpoint) |
| `presets` | `PresetRange[]` | Built-in defaults | Predefined date ranges |
| `showPresets` | `boolean` | `true` | Show preset sidebar/chip row |
| `autoApply` | `boolean` | `true` | Apply selection immediately (maps to `hideActions` on picker) |
| `inline` | `boolean` | `false` | Render picker directly without popup/input |
| `swipeable` | `boolean` | `true` | Enable touch swipe navigation |
| `fullscreen` | `boolean \| 'auto'` | `'auto'` | Fullscreen mode control |
| `hideYearMenu` | `boolean` | `false` | Disable year/month picker in header |
| `format` | `string` | `'fullDate'` | Display format in text input (Vuetify format key) |
| `separator` | `string` | `' – '` | Separator between start and end dates in input |

### Pass-Through Props (forwarded to underlying Vuetify components)

| Prop | Forwarded To | Description |
|---|---|---|
| `min` | VDatePicker | Minimum selectable date (ISO 8601) |
| `max` | VDatePicker | Maximum selectable date (ISO 8601) |
| `allowedDates` | VDatePicker | Function/array to control selectable dates |
| `allowedMonths` | VDatePicker | Function/array to control selectable months |
| `allowedYears` | VDatePicker | Function/array to control selectable years |
| `showWeek` | VDatePicker | Display ISO week numbers |
| `weeksInMonth` | VDatePicker | `'static'` (default) or `'dynamic'` |
| `firstDayOfWeek` | VDatePicker | 0=Sun, 1=Mon, etc. |
| `events` | VDatePicker | Date markers/dots |
| `eventColor` | VDatePicker | Color for event dots |
| `showAdjacentMonths` | VDatePicker | Show days from prev/next months |
| `controlVariant` | VDatePicker | `'docked'` or `'modal'` header style |
| `displayFormat` | VDateInput | Format shown in input |
| `inputFormat` | VDateInput | Format for manual typing |
| `updateOn` | VDateInput | When typed input updates model |
| `cancelText` | VDateInput | Cancel button text |
| `okText` | VDateInput | OK button text |
| `label` | VTextField | Input label |
| `variant` | VTextField | Input variant (outlined, filled, etc.) |
| `density` | VTextField | Density (default, comfortable, compact) |
| `color` | VDatePicker (via pickerProps) | Selection color |
| `disabled` | All | Disable the component |
| `readonly` | All | Readonly mode |
| `mobileBreakpoint` | VDateInput | Override mobile detection breakpoint |

### Events

| Event | Payload | Description |
|---|---|---|
| `update:modelValue` | `unknown \| unknown[] \| null` | Selection changed |
| `range-start` | `unknown` | Start date selected |
| `range-end` | `unknown` | End date selected (range complete) |
| `month-change` | `{ year: number, month: number }` | Visible month changed |
| `preset-select` | `PresetRange` | A preset was clicked |
| `open` | — | Picker popup opened |
| `close` | — | Picker popup closed |

### Slots

| Slot | Scope | Description |
|---|---|---|
| `preset` | `{ preset: PresetRange, active: boolean }` | Custom preset item rendering |
| `day` | `{ date: unknown, props: object, i: number, item: any }` | Custom day cell (wraps VDatePicker's #day) |
| `header` | `{ months: Array<{month, year}>, prev, next }` | Custom header |
| `actions` | `{ save: () => void, cancel: () => void, isPristine: boolean }` | Custom action buttons |
| `sidebar-left` | — | Custom left sidebar content |
| `sidebar-right` | — | Custom right sidebar content |
| `activator` | `{ props: Record<string, any>, isActive: boolean }` | Custom activator replacing the input |
| `title` | — | Custom title content (fullscreen top bar) |

---

## UX Design & Responsiveness

### Responsive Behavior Matrix (Updated for Vuetify 4 Breakpoints)

| Breakpoint | Threshold | Picker Container | Month Layout | Presets | Month Count Override |
|---|---|---|---|---|---|
| **xs** (< 600px) | 0 | Fullscreen dialog (slide-up) | Single column, vertical scroll | Horizontal chip row at top | Forced to `1` |
| **sm** (600–839px) | 600 | Fullscreen dialog | Single column, vertical scroll | Horizontal chip row at top | Forced to `1` |
| **md** (840–1144px) | 840 | VMenu popover | Side-by-side horizontal | Sidebar (left, collapsible) | Up to `2` |
| **lg** (1145–1544px) | 1145 | VMenu popover | Side-by-side horizontal | Sidebar (left, always visible) | Up to `3` |
| **xl** (1545+) | 1545 | VMenu popover | Side-by-side horizontal | Sidebar (left, always visible) | As configured |

- The `months` prop is a **maximum** — the component clamps it down based on available space
- `fullscreen="auto"` triggers fullscreen when `useDisplay().mobile` is true (default `mobileBreakpoint` is `lg` in Vuetify 4)

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

- VMenu anchored below VTextField with `location="bottom start"`
- Sidebar width: `180px` (configurable via CSS custom property)
- Month grids sit side-by-side with CSS `gap: 16px` (v4 gap-based layout)
- Navigation arrows: only the **leftmost ◀** and **rightmost ▶** shown
- Popover uses MD3 elevation level 2 (3dp shadow)
- Max height constrained; month area scrolls internally if needed

### Interaction Polish

#### Hover Preview (Desktop)
- After selecting start date, hovering shows **tentative range** via `#day` slot styling
- Hovered date gets circular outline (not filled — distinguishes from confirmed selection)
- Range preview updates on every `mousemove`
- Hovering before start date extends range backward

#### Selection Feedback
- Day cell click: brief **scale pulse** (scale 0.85 → 1.0, 150ms)
- Start/end dates: filled circle with primary color
- In-range dates: light primary background spanning edge-to-edge
- Range band has **rounded caps** only on start/end cells

#### Transitions & Animations
- **Month navigation**: grid slides left/right (200ms ease-out `transform: translateX`)
- **Popup open/close**: desktop uses VDialogTransition (v4 default); mobile uses slide-up
- **Preset selection**: range highlight animates with CSS transition (150ms)
- No animation when `prefers-reduced-motion: reduce` — respects OS setting

#### Swipe Gesture Details
- **Threshold**: 50px horizontal + velocity > 0.3px/ms
- **Visual feedback**: calendar translates with finger, then snaps
- **Momentum**: velocity > 1.0px/ms → skip 2 months
- **Vertical lock**: deltaY > deltaX in first 10px → cancel swipe
- **Edge bounce**: rubber-band at min/max boundaries

#### Smart Defaults
- No value → show current month (+ next if `months >= 2`)
- Existing range → center view with start date's month as leftmost
- **Escape** closes without applying (if `autoApply=false`)
- **Enter** applies and closes
- Click outside: applies if `autoApply=true`, cancels if `false`

### Accessibility (WCAG 2.1 AA)

- **Focus management**: popup opens → focus to calendar; closes → focus to input
- **Focus trapping**: in fullscreen, Tab cycles within dialog (VDialog's `captureFocus`)
- **Screen reader**: `aria-live="polite"` announces month changes and range confirmation
- **Color contrast**: 4.5:1 text, 3:1 range highlight
- **Touch targets**: 44×44px in fullscreen, 36×36px in popover
- **Keyboard-only**: every mouse action achievable by keyboard
- **`prefers-reduced-motion`**: all animations disabled
- Inherits VDatePicker's built-in a11y (grid role, aria-selected, etc.)

---

## CSS Custom Properties & Layers

### Layer Declaration

```scss
// main.scss — declare our layer in the Vuetify layer hierarchy
@layer vuetify-core, vuetify-components, vuetify-advanced-date, vuetify-overrides, vuetify-utilities;
```

All component styles are scoped within `@layer vuetify-advanced-date`:

```scss
@layer vuetify-advanced-date {
  .v-advanced-date-input { ... }
  .v-advanced-date-picker { ... }
  .v-advanced-date-presets { ... }
  .v-advanced-date-header { ... }
}
```

### Custom Properties

```scss
// Consumers can override these for customization
// NOTE: v4 uses color-mix() for transparency instead of rgba(var(--v-theme-*), opacity)

--v-advanced-date-range-bg: color-mix(in srgb, rgb(var(--v-theme-primary)) 10%, transparent);
--v-advanced-date-range-hover-bg: color-mix(in srgb, rgb(var(--v-theme-primary)) 5%, transparent);
--v-advanced-date-selected-bg: rgb(var(--v-theme-primary));
--v-advanced-date-selected-text: rgb(var(--v-theme-on-primary));
--v-advanced-date-today-border: 1px solid rgb(var(--v-theme-primary));
--v-advanced-date-preset-active-bg: color-mix(in srgb, rgb(var(--v-theme-primary)) 8%, transparent);
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
| Extend vs Fork | **Extend (wrap VDatePicker)** | v4's native range support eliminates need to rewrite selection logic; forward-compatible |
| Multi-month approach | **N × VDatePicker with synced month/year** | Each picker handles its own rendering, a11y, theming; we just sync navigation |
| No VAdvancedDateMonth | **Removed** | VDatePicker handles month rendering natively; `#day` slot gives us hover preview |
| Swipe library | **Vanilla JS** | Zero dependencies; simple touch math |
| Styling approach | **SASS + CSS custom properties + @layer** | Matches Vuetify 4 layer architecture |
| Date library | **Vuetify's date adapter** | Users configure their date library with Vuetify; we use `useDate()` |
| Build tool | **Vite 6 library mode** | Standard for Vue 3 libs, tree-shakeable ESM |
| Model format | **`unknown[]`** (adapter-dependent) | Matches VDatePicker's native v4 format; adapter-agnostic |
| Component file format | **`.vue` SFC** | Standard Vue DX |
| Transparency colors | **`color-mix()`** | v4 requirement — `rgba(var(--v-theme-*))` breaks with transparent theme colors |
| Breakpoints | **Use v4 reduced defaults** | md: 840px, lg: 1145px, xl: 1545px — matches consumer's Vuetify config |
| ESLint | **Flat config (v9)** | Modern standard, no `.eslintrc` |

---

## Key Differences from V3 Plan

| Aspect | V3 Plan | V4 Plan |
|---|---|---|
| Range selection | Custom state machine in `useAdvancedDate` | Native `multiple="range"` on VDatePicker |
| Month rendering | Custom `VAdvancedDateMonth` component | Reuse `VDatePicker` with `hideHeader` |
| Input + menu wiring | Manual VTextField + VMenu/VDialog | Leverage VDateInput patterns, or compose manually |
| Hover preview | Custom mouse tracking on day grid | Use VDatePicker's `#day` slot |
| Model format | `[Date, Date]` tuple | `unknown[]` (adapter-agnostic) |
| CSS architecture | SASS + CSS vars | SASS + CSS vars + `@layer` (mandatory in v4) |
| Theme default | Light | System (v4 default) |
| Breakpoints | md: 960, lg: 1280, xl: 1920 | md: 840, lg: 1145, xl: 1545 |
| Typography | MD2 | MD3 (display-*, headline-*, body-*, label-*) |
| Elevation | 0-24 levels | 0-5 levels (MD3) |
| Grid layout | Padding-based | Gap-based |
| Color transparency | `rgba(var(--v-theme-*), 0.1)` | `color-mix(in srgb, ...)` |
| Date constraints | Custom `allowedDates` only | Native `allowedDates` + `allowedMonths` + `allowedYears` |
| Events/markers | Custom implementation (P2) | Native `events` + `eventColor` pass-through |
| Week numbers | Custom (P1) | Native `showWeek` pass-through |
| Component count | 5 custom components | 4 custom components (removed VAdvancedDateMonth) |
| Peer deps | Vue 3.3+, Vuetify 3.4+ | Vue 3.5+, Vuetify 4.x |

---

## Resolved Questions

| Question | Decision |
|---|---|
| Nuxt module auto-import? | **No** — not planned |
| Headless/unstyled mode? | **No** — not planned |
| SSR compatibility? | **No** — client-side only |
| npm scope? | **Yes** — publish as `@gigerit/vuetify-date-input-advanced` |

## Open Questions (for later)

_None remaining._

### Resolved During Planning

- **StringDateAdapter compatibility**: No special option needed. Our model type is `unknown[]` and all date math uses `useDate()`, so it works transparently with any adapter (native Date, date-fns, dayjs, luxon, or StringDateAdapter).
- **Configurable `@layer` name**: Yes. The layer name (`vuetify-advanced-date` by default) will be configurable via a SASS variable so consumers can slot it into their own layer ordering. Example:
  ```scss
  @use '@gigerit/vuetify-date-input-advanced/styles/variables' with (
    $layer-name: 'my-custom-layer',
  );
  ```
