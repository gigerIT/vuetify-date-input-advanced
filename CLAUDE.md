# CLAUDE.md

This file provides guidance for AI assistants working on the **vuetify-date-input-advanced** codebase.

## Project Overview

An advanced date picker/input component library for **Vuetify 3** and **Vue 3**. It wraps Vuetify's `VDatePicker` pattern with enterprise-grade features: multi-month display, date range selection with hover preview, predefined presets, swipe navigation, fullscreen mobile mode, and responsive layouts.

- **Version:** 1.0.0
- **License:** MIT
- **Peer dependencies:** Vue ^3.5, Vuetify ^3.11
- **Zero runtime dependencies** beyond peers

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Vue 3 (Composition API, `<script setup>`) |
| UI Library | Vuetify 3 |
| Language | TypeScript (strict mode) |
| Build | Vite 7 (library mode, ES + UMD output) |
| Tests | Vitest + @vue/test-utils (jsdom environment) |
| Styling | SASS/SCSS |
| Icons | @mdi/font |
| Type checking | vue-tsc |

## Commands

```bash
npm run dev          # Start playground dev server (playground/vite.config.ts)
npm run build        # Build library + generate type declarations
npm run build:lib    # Build library only (no type declarations)
npm run typecheck    # Run vue-tsc type checking (no emit)
npm run test         # Run tests with Vitest (single run)
npm run test:watch   # Run tests in watch mode
npm run lint         # ESLint on src/ (.ts, .vue files)
npm run lint:fix     # ESLint with auto-fix
```

### Build pipeline

1. `vite build` — bundles to `dist/vuetify-date-input-advanced.{es,umd}.js` + CSS
2. `vue-tsc --declaration --emitDeclarationOnly --outDir dist/types` — generates `.d.ts` files

## Directory Structure

```
src/
├── components/               # Vue SFC components
│   ├── VAdvancedDateInput/   # Top-level input with popup/dialog/inline modes
│   ├── VAdvancedDatePicker/  # Main picker panel orchestrating all sub-components
│   ├── VAdvancedDateMonth/   # Month grid renderer (6×7 day cells)
│   ├── VAdvancedDateHeader/  # Month/year navigation header
│   └── VAdvancedDatePresets/ # Preset sidebar (desktop) / chips (mobile)
├── composables/              # Vue Composition API functions
│   ├── useAdvancedDate.ts    # Date selection state machine (core logic)
│   ├── useMultiMonth.ts      # Multi-month navigation & breakpoint clamping
│   ├── useHoverPreview.ts    # Range hover preview tracking
│   ├── usePresets.ts         # Preset computation and activation detection
│   ├── useSwipe.ts           # Touch swipe with velocity & momentum
│   └── useFullscreen.ts      # Fullscreen mode resolution (auto/true/false)
├── types/
│   ├── props.ts              # All component props with defaults & types
│   └── presets.ts            # PresetRange interface
├── utils/
│   ├── dateHelpers.ts        # Pure date manipulation functions (no deps)
│   └── dom.ts                # Swipe calculation & motion preference
├── styles/
│   ├── main.scss             # Master import file
│   └── variables.scss        # CSS custom properties
├── plugin.ts                 # Vue plugin factory (createAdvancedDateInput)
├── index.ts                  # Public API barrel export
└── env.d.ts                  # Vite environment types

playground/                   # Development demo app
├── App.vue                   # Interactive examples
├── main.ts                   # Entry point
├── index.html                # HTML template
└── vite.config.ts            # Dev server config
```

## Architecture

### Component hierarchy

```
VAdvancedDateInput
├── [Desktop] VMenu → VAdvancedDatePicker
├── [Mobile]  VDialog → VAdvancedDatePicker
└── [Inline]  VAdvancedDatePicker (no wrapper)

VAdvancedDatePicker
├── VAdvancedDatePresets (sidebar or chip group)
├── VAdvancedDateHeader × N (one per visible month)
├── VAdvancedDateMonth × N (one per visible month)
└── Action bar (Cancel/Apply when autoApply=false)
```

### State machine (useAdvancedDate)

The date selection follows a three-phase state machine:
- **`idle`** — No selection in progress
- **`start-selected`** — First date clicked, waiting for end date (range mode)
- **`complete`** — Selection finalized

In non-auto-apply mode, selections are staged in `pendingStart`/`pendingEnd` until `apply()` is called.

### Key design decisions

- **Wrapper pattern, not a fork:** Wraps Vuetify's native components rather than forking them, for easier upgrades.
- **All date math is pure functions** in `utils/dateHelpers.ts` — no external date library.
- **Composables own the logic, components own the rendering.** Each composable is independently testable.
- **Responsive month clamping:** The `months` prop sets the *maximum*; the actual count is clamped by viewport breakpoint via `useMultiMonth`.

## Public API

Everything exported from `src/index.ts`:
- **Plugin:** `createAdvancedDateInput(options)`
- **Components:** `VAdvancedDateInput`, `VAdvancedDatePicker`, `VAdvancedDatePresets`, `VAdvancedDateHeader`, `VAdvancedDateMonth`
- **Composables:** `useAdvancedDate`, `useMultiMonth`, `useHoverPreview`, `usePresets`, `useSwipe`, `useFullscreen`
- **Types:** `PresetRange`, `DateModelValue`, `FullscreenMode`, `SelectionPhase`

## Code Conventions

### TypeScript

- **Strict mode** is enabled (`tsconfig.json` → `"strict": true`).
- No `any` usage — all types must be explicit or inferable.
- Component props are defined in `src/types/props.ts` using `PropType<T>` generics.
- Path alias: `@` maps to `./src`.

### Vue components

- Use `<script setup lang="ts">` for all components.
- Each component lives in its own directory with an `index.ts` barrel export.
- Component-scoped SCSS files use `@use` imports, not `@import`.

### Styling

- SCSS for all styles. Component styles live alongside their `.vue` files.
- CSS custom properties for theming (prefixed `--v-advanced-date-*`).
- Builds with `cssCodeSplit: false` — all styles bundled into one CSS file.
- Rely on Vuetify's theming system for colors, dark mode, density, etc.

### Date handling

- All date comparisons use day precision via `startOfDay()`.
- Dates are always `new Date()` objects — no string-based date math.
- `addMonths()` handles day overflow (e.g., Jan 31 + 1 month → Feb 28).
- `buildMonthGrid()` always produces 42 cells (6 weeks × 7 days).

### Naming

- Components: `VAdvancedDate*` prefix (follows Vuetify `V*` convention).
- Composables: `use*` prefix.
- Types: PascalCase (e.g., `PresetRange`, `SelectionPhase`).
- Utility functions: camelCase.

## Testing

- **Framework:** Vitest with `@vue/test-utils`
- **Environment:** jsdom
- **Config:** `vitest.config.ts` (globals enabled, Vuetify inlined)
- **Run:** `npm run test` (single run) or `npm run test:watch`
- Test files should be co-located or under a `tests/` directory using `*.test.ts` or `*.spec.ts` naming.

Note: The test suite is in early stages. When adding features or fixing bugs, add corresponding tests.

## Build & Distribution

- **Library entry:** `src/index.ts`
- **Output formats:** ES module + UMD (`dist/`)
- **Externals:** `vue`, `vuetify`, `vuetify/components`, `vuetify/directives`, `vuetify/lib` are externalized (not bundled)
- **Types:** Generated into `dist/types/` via `vue-tsc`
- **Package exports:**
  - `.` → ES/UMD module + types
  - `./styles` → compiled CSS

## Responsive breakpoints

| Breakpoint | Viewport | Max months | Presets UI | Container |
|-----------|----------|------------|-----------|-----------|
| xs | <600px | 1 | Horizontal chips | Fullscreen dialog |
| sm | 600–959px | 1 | Horizontal chips | Fullscreen dialog |
| md | 960–1279px | 2 | Vertical sidebar | Menu popover |
| lg | 1280–1919px | 3 | Vertical sidebar | Menu popover |
| xl | 1920px+ | props.months | Vertical sidebar | Menu popover |

## Common Tasks

### Adding a new composable

1. Create `src/composables/useMyFeature.ts`
2. Export from `src/composables/index.ts`
3. Re-export from `src/index.ts`
4. Add corresponding types to `src/types/` if needed

### Adding a new component

1. Create `src/components/VAdvancedDateFoo/VAdvancedDateFoo.vue` + `index.ts`
2. Add SCSS using `@use` in `src/styles/main.scss`
3. Export from `src/index.ts`
4. Register in `src/plugin.ts` if it should be auto-registered

### Modifying props

All shared props are defined in `src/types/props.ts`. Update the `advancedDateInputProps` object, then propagate changes to components that consume those props.

### Testing with the playground

Run `npm run dev` to launch the playground. Edit `playground/App.vue` to test component configurations interactively.
