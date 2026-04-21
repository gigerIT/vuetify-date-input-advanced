# @gigerit/vuetify-date-input-advanced

<img src="./docs/images/screenshot1.png" alt="Advanced Date Input" width="700" />

<img src="./docs/images/screenshot1_dark.png" alt="Advanced Date Input" width="700" />

## <a href="https://vuetify-date-input-advanced.pages.dev/" target="_blank">Demo</a>

## Features

- Multi-month picker with range selection by default
- Single-date mode with `:range="false"`
- Inline picker or input-triggered overlay
- Desktop menu and mobile fullscreen dialog behavior in `VAdvancedDateInput`
- Vuetify-styled split start/end inputs in range mode
- Typed input parsing and validation
- Controlled `v-model:text` support with draft-state events
- Configurable overlay draft close strategies: revert, preserve, or commit
- Exposed input instance API for parent-driven validate / commit / revert flows
- Optional picker-only single-date mode with `inputReadonly`
- Built-in range presets plus custom preset slots
- `min`, `max`, `allowedDates`, `allowedStartDates`, and `allowedEndDates` constraints
- Configurable week start via `firstDayOfWeek`
- Optional week numbers
- Keyboard navigation and live announcements
- Theme-aware styling with CSS custom properties and optional Sass variables

Advanced date selection components for Vuetify 4.

`@gigerit/vuetify-date-input-advanced` provides two components:

- `VAdvancedDatePicker`: a standalone multi-month calendar panel
- `VAdvancedDateInput`: a typed input wrapper that adds overlay behavior and the same picker surface

The components use Vuetify's active date adapter through `useDate()`, so locale, formatting, and runtime value types follow your app's Vuetify date configuration.

## Exports

| Export                                                                                                                                                                                                                                                                                                                                     | Description                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| `AdvancedDatePlugin`                                                                                                                                                                                                                                                                                                                       | Registers both components globally           |
| `VAdvancedDateInput`                                                                                                                                                                                                                                                                                                                       | Text field wrapper + picker                  |
| `VAdvancedDatePicker`                                                                                                                                                                                                                                                                                                                      | Standalone picker panel                      |
| `dateInputAdvancedEn`, `dateInputAdvancedCs`, `dateInputAdvancedDe`, `dateInputAdvancedFr`, `dateInputAdvancedIt`, `dateInputAdvancedLt`                                                                                                                                                                                                   | Built-in locale message bundles              |
| `AdvancedDateModel`, `PresetRange`, `AdvancedDateAdapter`, `AdvancedDateDay`, `AdvancedDateMonthData`, `AdvancedDateWeek`, `DateBounds`, `NormalizedRange`, `DateInputAdvancedLocaleMessages`, `AdvancedDateIconValue`, `AdvancedDateIconSvgPath`, `AdvancedDateInputField`, `AdvancedDateInputFieldProps`                                 | Core public TypeScript types                 |
| `AdvancedDateInputDraft`, `AdvancedDateInputPublicInstance`, `AdvancedDateInputCommitPayload`, `AdvancedDateInputInvalidPayload`, `AdvancedDateInputClosePayload`, `AdvancedDateInputSource`, `AdvancedDateInputParseStatus`, `AdvancedDateInputAvailabilityStatus`, `AdvancedDateInputValidationStatus`, `AdvancedDateInputCloseStrategy` | Text-input draft and public-handle contracts |

## Requirements

- `vue@^3.5.0`
- `vuetify@^4.0.0`
- A Vuetify app already configured in your project, including any official Vuetify icon setup you want to use

Default component icons use Vuetify aliases (`$calendar`, `$prev`, and `$next`), so they resolve through the same icon configuration as native Vuetify components.

## Install

```sh
npm install vue vuetify
npm install @gigerit/vuetify-date-input-advanced
```

Import the stylesheet once in your app entry:

```ts
import '@gigerit/vuetify-date-input-advanced/style.css'
```

Register the components globally:

```ts
import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'

import { AdvancedDatePlugin } from '@gigerit/vuetify-date-input-advanced'
import '@gigerit/vuetify-date-input-advanced/style.css'

createApp(App).use(vuetify).use(AdvancedDatePlugin).mount('#app')
```

If you prefer local registration, import `VAdvancedDateInput` and `VAdvancedDatePicker` directly instead of using `AdvancedDatePlugin`.

## Styling

For the default styling path, import the prebuilt stylesheet once:

```ts
import '@gigerit/vuetify-date-input-advanced/style.css'
```

If you need compile-time customization, compile the package Sass entry instead
of importing `style.css`:

```scss
@use '@gigerit/vuetify-date-input-advanced/styles' with (
  $advanced-date-picker-cell-size: 44px,
  $advanced-date-picker-month-slide-duration: 0.36s,
  $advanced-date-picker-month-slide-easing: cubic-bezier(0.4, 0, 0.2, 1),
  $advanced-date-picker-preset-width: 260px,
  $advanced-date-picker-day-font-weight: 600,
  $advanced-date-picker-week-label-color: rgb(90, 90, 90)
);
```

Desktop month navigation can be tuned with
`$advanced-date-picker-month-slide-duration` and
`$advanced-date-picker-month-slide-easing`.
Weekday headers and week numbers use `$advanced-date-picker-week-label-color`.

Package Sass variables default to Vuetify's native date-picker and button
variables where equivalent values exist. To let customized Vuetify Sass
settings flow into these defaults, configure `vuetify/settings` before loading
the package styles in the same Sass graph:

```scss
@use 'vuetify/settings' with (
  $date-picker-month-day-size: 44px,
  $button-font-weight: 600
);

@use '@gigerit/vuetify-date-input-advanced/styles';
```

Use either the prebuilt CSS import or the Sass entry. Importing both will load
the component styles twice.

## Quick Start

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { AdvancedDateModel } from '@gigerit/vuetify-date-input-advanced'

const today = new Date()
const inSevenDays = new Date(today)
inSevenDays.setDate(today.getDate() + 6)

const value = ref<AdvancedDateModel<Date>>([today, inSevenDays])
</script>

<template>
  <v-advanced-date-input v-model="value" label="Travel dates" :months="2" />
</template>
```

Single-date mode:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { AdvancedDateModel } from '@gigerit/vuetify-date-input-advanced'

const value = ref<AdvancedDateModel<Date>>(new Date())
</script>

<template>
  <v-advanced-date-input
    v-model="value"
    label="Departure"
    :range="false"
    :show-presets="false"
  />
</template>
```

Standalone inline picker with controlled visible month:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { AdvancedDateModel } from '@gigerit/vuetify-date-input-advanced'

const value = ref<AdvancedDateModel<Date>>(null)
const month = ref(0)
const year = ref(2026)
</script>

<template>
  <v-advanced-date-picker
    v-model="value"
    v-model:month="month"
    v-model:year="year"
    :months="2"
    :first-day-of-week="1"
    :auto-apply="false"
  />
</template>
```

In the current implementation and tests, `month` is zero-based, so `0` is January.
Use `first-day-of-week` in templates to match Vuetify's `VDatePicker` behavior, where `0` is Sunday, `1` is Monday, and so on.

## Model Shapes

Examples below use native `Date`, but the actual runtime value type is the active Vuetify adapter type `TDate`.

| `range` | `returnObject` | Emitted shape              |
| ------- | -------------- | -------------------------- |
| `true`  | `false`        | `null` or `[start, end]`   |
| `true`  | `true`         | `null` or `{ start, end }` |
| `false` | ignored        | `null` or `date`           |

Notes:

- In range mode, the component accepts either a tuple or `{ start, end }` object as input.
- With `autoApply=true`, range selection can emit an incomplete value such as `[start, null]` after the first click.
- If the user picks an earlier end date, the range is normalized into chronological order before emit.

## Behavior

### Presets

Presets are shown only in range mode. If you omit `presets`, the picker generates these built-in options:

- `Today`
- `Yesterday`
- `Last 7 Days`
- `Last 30 Days`
- `This Month`
- `Last Month`
- `This Quarter`
- `Last Quarter`
- `Year to Date`
- `Last Year`

Custom preset shape:

```ts
type PresetRange<TDate> = {
  label: string
  value: [TDate, TDate] | (() => [TDate, TDate])
  slot?: string
}
```

If `preset.slot` is `"highlight"`, the picker looks for a `preset-highlight` slot before falling back to `preset`.

Presets that violate the active date constraints are rendered disabled and do not emit `presetSelect`.

Example:

```vue
<script setup lang="ts">
import type { PresetRange } from '@gigerit/vuetify-date-input-advanced'

const presets: PresetRange<Date>[] = [
  {
    label: 'Weekend Escape',
    slot: 'highlight',
    value: () => {
      const start = new Date('2026-01-16')
      const end = new Date('2026-01-18')
      return [start, end]
    },
  },
]
</script>

<template>
  <v-advanced-date-input :presets="presets" :auto-apply="false">
    <template #preset-highlight="{ preset }">
      <div class="d-flex align-center justify-space-between w-100">
        <span>{{ preset.label }}</span>
        <v-chip size="x-small" color="primary" variant="tonal">Custom</v-chip>
      </div>
    </template>
  </v-advanced-date-input>
</template>
```

### Typed Input

`VAdvancedDateInput` parses text on blur and on `Enter`. In single-date mode,
`inputReadonly` makes the text field a picker opener only.

On mobile non-inline layouts, built-in activator presses are intercepted before
the text input can focus, and the activator becomes readonly while the
fullscreen dialog is opening or open. This prevents the virtual keyboard from
flashing during the transition.

Parsing order:

- `parseInput(value)` if provided
- `adapter.date(value)`
- ISO strings matching `YYYY-MM-DD...`
- native `Date.parse`

Validation uses the same `min`, `max`, `allowedDates`, `allowedStartDates`, and `allowedEndDates` constraints as calendar clicks.

Input formatting uses `displayFormat`, which is passed directly to `adapter.format(...)`. The default is `fullDate`.

Range text uses `rangeSeparator`, which defaults to `–`. The current implementation also accepts common spaced dash separators such as `-` and `—`.

### Range Input Fields

In range mode, the default activator renders two Vuetify text fields: one for
the start date and one for the end date. Shared Vuetify field props such as
`label`, `variant`, `hideDetails`, `messages`, `rules`, `clearable`, and
validation state apply to the grouped control. Side-specific input details use
`startFieldProps` and `endFieldProps`.

`text`, `update:text`, and `draft.text` remain a single combined string using
`rangeSeparator`. Users can still paste a complete range into either side. When
a side becomes active, its full native input text is selected so typing replaces
the current value immediately.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type {
  AdvancedDateInputFieldProps,
  AdvancedDateModel,
} from '@gigerit/vuetify-date-input-advanced'

const value = ref<AdvancedDateModel<Date>>(null)

const startFieldProps = {
  placeholder: 'Start date',
  name: 'bookingStartDate',
  ariaLabel: 'Booking start date',
} satisfies AdvancedDateInputFieldProps

const endFieldProps = {
  placeholder: 'End date',
  name: 'bookingEndDate',
  ariaLabel: 'Booking end date',
} satisfies AdvancedDateInputFieldProps
</script>

<template>
  <v-advanced-date-input
    v-model="value"
    label="Booking dates"
    :start-field-props="startFieldProps"
    :end-field-props="endFieldProps"
  />
</template>
```

### Controlled Text and Draft Lifecycle

Bind `v-model:text` when the parent needs to own the visible field text instead of treating it as a formatted mirror of `modelValue`.

- `update:text` emits whenever the component wants to change the displayed text
- `update:draft` emits the current `AdvancedDateInputDraft<TDate>` snapshot, including parse, availability, and validation state
- `inputCommit` emits after a successful text or picker commit
- `inputInvalid` emits when commit or close validation fails
- `draftClose` reports overlay close attempts with their `reason`, `strategy`, and `outcome`

When the text is controlled and differs from the formatted committed value, the input enters text-draft mode. In that mode the popup selection is kept in sync with the parsed text, including parser and availability changes from `parseInput`, `rangeSeparator`, `min`, `max`, `allowedDates`, `allowedStartDates`, and `allowedEndDates`.

`closeDraftStrategy` controls what happens when the overlay closes while a draft is still pending:

- `revert`: discard the draft and return to the committed value
- `preserve`: close the overlay but keep the current draft text and draft selection
- `commit`: validate and commit the draft before closing; if validation fails, the close is blocked

Parent-managed submit flow:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type {
  AdvancedDateInputDraft,
  AdvancedDateInputPublicInstance,
  AdvancedDateModel,
} from '@gigerit/vuetify-date-input-advanced'

const value = ref<AdvancedDateModel<Date>>(null)
const text = ref('')
const draft = ref<AdvancedDateInputDraft<Date> | null>(null)
const inputRef = ref<AdvancedDateInputPublicInstance<Date> | null>(null)

async function submitFromParent() {
  const committed = await inputRef.value?.commitInput()

  if (!committed) {
    console.log(inputRef.value?.errorMessages)
  }
}
</script>

<template>
  <v-advanced-date-input
    ref="inputRef"
    v-model="value"
    v-model:text="text"
    :auto-apply="false"
    close-draft-strategy="commit"
    @update:draft="draft = $event"
  />

  <v-btn @click="submitFromParent">Submit</v-btn>
</template>
```

### Input Attr Forwarding

When `VAdvancedDateInput` renders a single-date field, non-prop attrs and
listeners fall through to the internal `VTextField`. Use this for form-oriented
attrs such as `id`, `name`, `aria-*`, `data-*`, and hooks such as `@blur` or
`@keydown`.

```vue
<v-advanced-date-input
  v-model="value"
  :range="false"
  id="booking-start-date"
  name="bookingStartDate"
  data-testid="booking-start-date"
  @blur="validateField"
/>
```

In range mode, non-prop attrs and listeners are applied to the connected range
field shell. Put native start/end input attrs in `startFieldProps` and
`endFieldProps`.

```vue
<v-advanced-date-input
  v-model="value"
  id="booking-dates"
  data-testid="booking-dates"
  :start-field-props="{ id: 'booking-start-date', name: 'bookingStartDate' }"
  :end-field-props="{ id: 'booking-end-date', name: 'bookingEndDate' }"
/>
```

If you provide the `activator` slot, the slot content owns its own attrs and listeners.
`inputReadonly` only affects the built-in single-date text field, so it has no
effect in range mode, when `inline` is enabled, or when you provide a custom
`activator` slot. Use `readonly`, `startFieldProps.readonly`, or
`endFieldProps.readonly` for range-mode readonly fields. The mobile fullscreen
keyboard-suppression behavior still applies to built-in range fields.

### Overlay and Mobile Behavior

`VAdvancedDateInput` changes presentation by context:

- Desktop, non-inline: picker inside `VMenu`
- Mobile, non-inline: picker inside fullscreen `VDialog`
- `inline`: picker rendered directly with no overlay

On mobile, the picker switches to a vertically scrollable, windowed month list instead of desktop-style prev/next nav buttons.
The built-in mobile fullscreen activator fields suppress control focus on press
and become readonly while the dialog is opening or open to avoid showing the
touchscreen keyboard. Custom `activator` slots own their own mobile focus and
keyboard behavior.

### Apply / Cancel

`autoApply` controls calendar click behavior:

- `true`: updates `modelValue` as the user selects dates
- `false`: keeps a draft selection in the picker and shows `Apply` / `Cancel`

## API

### Shared Props

These props are accepted by both `VAdvancedDateInput` and `VAdvancedDatePicker`.

| Prop                | Type                                       | Default                   | Notes                                                                                                             |
| ------------------- | ------------------------------------------ | ------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `modelValue`        | `AdvancedDateModel<TDate>`                 | `null`                    | Current value                                                                                                     |
| `range`             | `boolean`                                  | `true`                    | Set `false` for single-date mode                                                                                  |
| `returnObject`      | `boolean`                                  | `false`                   | Range mode only; emits `{ start, end }` instead of a tuple                                                        |
| `months`            | `number`                                   | `2`                       | Visible month count, clamped to at least `1`                                                                      |
| `month`             | `number \| undefined`                      | current month             | Leading visible month                                                                                             |
| `year`              | `number \| undefined`                      | current year              | Leading visible year                                                                                              |
| `presets`           | `PresetRange<TDate>[] \| undefined`        | built-in range presets    | Ignored when `range=false`                                                                                        |
| `showPresets`       | `boolean`                                  | `true`                    | Shows or hides the preset list in range mode                                                                      |
| `swipeable`         | `boolean`                                  | `true`                    | Public prop; the current source does not attach swipe handlers                                                    |
| `autoApply`         | `boolean`                                  | `true`                    | `false` enables draft selection and footer actions                                                                |
| `min`               | `TDate \| null`                            | `null`                    | Minimum selectable date                                                                                           |
| `max`               | `TDate \| null`                            | `null`                    | Maximum selectable date                                                                                           |
| `allowedDates`      | `(date: TDate) => boolean`                 | `undefined`               | Shared per-day availability check applied to both endpoints                                                       |
| `allowedStartDates` | `(date: TDate) => boolean`                 | `undefined`               | Additional availability check for single dates and ordered range starts                                           |
| `allowedEndDates`   | `(date: TDate) => boolean`                 | `undefined`               | Additional availability check for ordered range ends                                                              |
| `showWeekNumbers`   | `boolean`                                  | `false`                   | Displays week numbers; uses adapter week calculations when available and otherwise falls back to ISO week numbers |
| `firstDayOfWeek`    | `string \| number \| undefined`            | adapter or locale default | Mirrors Vuetify `VDatePicker`; `0` starts weeks on Sunday, `1` on Monday, and so on                               |
| `prevIcon`          | `AdvancedDateIconValue`                    | `$prev`                   | Previous-month navigation icon; accepts Vuetify aliases, prefixed set strings, SVG path arrays, or components     |
| `nextIcon`          | `AdvancedDateIconValue`                    | `$next`                   | Next-month navigation icon; accepts Vuetify aliases, prefixed set strings, SVG path arrays, or components         |
| `disabled`          | `boolean`                                  | `false`                   | Applies disabled state to wrapper controls; day availability still comes primarily from date constraints          |
| `readonly`          | `boolean`                                  | `false`                   | Full picker read-only mode: blocks calendar and preset interaction, and hides the manual action footer            |
| `color`             | `string`                                   | `primary`                 | Accent color for selected days and range previews                                                                 |
| `theme`             | `string \| undefined`                      | inherited                 | Passed to the picker `VSheet`                                                                                     |
| `rounded`           | `string \| number \| boolean \| undefined` | `undefined`               | Passed to the picker `VSheet`                                                                                     |
| `border`            | `string \| number \| boolean`              | `true`                    | Passed to the picker `VSheet`                                                                                     |
| `elevation`         | `string \| number`                         | `2`                       | Passed to the picker `VSheet`                                                                                     |
| `width`             | `string \| number \| undefined`            | `undefined`               | Picker width                                                                                                      |
| `minWidth`          | `string \| number \| undefined`            | `undefined`               | Picker min width; also used for the desktop menu wrapper                                                          |
| `maxWidth`          | `string \| number \| undefined`            | `undefined`               | Picker max width                                                                                                  |
| `density`           | `'default' \| 'comfortable' \| 'compact'`  | `default`                 | Picker density and input density                                                                                  |

### `VAdvancedDateInput`-Only Props

| Prop                 | Type                                       | Default     | Notes                                                                                                           |
| -------------------- | ------------------------------------------ | ----------- | --------------------------------------------------------------------------------------------------------------- |
| `menu`               | `boolean`                                  | `false`     | Controlled open state for the menu or dialog                                                                    |
| `inline`             | `boolean`                                  | `false`     | Renders the picker directly instead of using an overlay                                                         |
| `label`              | `string \| undefined`                      | `undefined` | Shared field label for either the single-date field or range field group                                        |
| `placeholder`        | `string \| undefined`                      | `undefined` | Single-date input placeholder. In range mode, use `startFieldProps.placeholder` and `endFieldProps.placeholder` |
| `variant`            | `string`                                   | `outlined`  | Shared field variant                                                                                            |
| `hideDetails`        | `boolean \| 'auto'`                        | `auto`      | Shared field details behavior                                                                                   |
| `messages`           | `string \| string[] \| undefined`          | `undefined` | Shared field messages                                                                                           |
| `error`              | `boolean`                                  | `false`     | Combines with internal parse and validation errors                                                              |
| `errorMessages`      | `string \| string[] \| undefined`          | `undefined` | Merged with internal parse and validation errors                                                                |
| `rules`              | `readonly unknown[]`                       | `[]`        | Validates the single-date field or combined range text                                                          |
| `clearable`          | `boolean`                                  | `false`     | Clears both text and model                                                                                      |
| `focused`            | `boolean`                                  | `false`     | Single-date `VTextField` focus state. In range mode, use `activeField`                                          |
| `activeField`        | `'start' \| 'end' \| undefined`            | `undefined` | Range-mode active side. When set on desktop, the side input is focused and its text selected, and programmatic picker opens use it as the default boundary |
| `prependInnerIcon`   | `AdvancedDateIconValue \| undefined`       | `undefined` | Single-date `VTextField` prepend icon. In range mode, use side-specific field props                             |
| `appendInnerIcon`    | `AdvancedDateIconValue`                    | `$calendar` | Single-date `VTextField` append icon. In range mode, use side-specific field props                              |
| `startFieldProps`    | `AdvancedDateInputFieldProps \| undefined` | `undefined` | Range-mode start input props                                                                                    |
| `endFieldProps`      | `AdvancedDateInputFieldProps \| undefined` | `undefined` | Range-mode end input props                                                                                      |
| `inputReadonly`      | `boolean`                                  | `false`     | Makes the single-date field readonly while keeping the picker, icon, and footer actions interactive             |
| `text`               | `string \| undefined`                      | `undefined` | Controlled combined text value for parent-owned draft flows                                                     |
| `closeDraftStrategy` | `'revert' \| 'preserve' \| 'commit'`       | `revert`    | Controls how pending drafts behave when the overlay closes                                                      |
| `displayFormat`      | `string`                                   | `fullDate`  | Passed to `adapter.format(...)` for text display                                                                |
| `rangeSeparator`     | `string`                                   | `–`         | Separator used for formatted range text                                                                         |
| `parseInput`         | `(value: string) => TDate \| null`         | `undefined` | Custom parser used before adapter and native parsing                                                            |

`AdvancedDateInputFieldProps` supports the side-specific range input details
that should not apply to the whole grouped field:

```ts
type AdvancedDateInputField = 'start' | 'end'

interface AdvancedDateInputFieldProps {
  placeholder?: string
  prependInnerIcon?: AdvancedDateIconValue
  appendInnerIcon?: AdvancedDateIconValue
  readonly?: boolean
  id?: string
  name?: string
  ariaLabel?: string
  class?: unknown
  style?: StyleValue
  attrs?: Record<string, string | number | boolean | null | undefined>
}
```

### Events

| Event                | Component | Payload                                  | Notes                                                                  |
| -------------------- | --------- | ---------------------------------------- | ---------------------------------------------------------------------- |
| `update:modelValue`  | both      | `AdvancedDateModel<TDate>`               | Main value update                                                      |
| `update:menu`        | input     | `boolean`                                | Overlay open state                                                     |
| `update:text`        | input     | `string`                                 | Requested text change for controlled text mode                         |
| `update:activeField` | input     | `'start' \| 'end'`                       | Active range input side                                                |
| `update:draft`       | input     | `AdvancedDateInputDraft<TDate>`          | Current parsed draft snapshot                                          |
| `update:month`       | both      | `number`                                 | Leading visible month after user navigation                            |
| `update:year`        | both      | `number`                                 | Leading visible year after user navigation                             |
| `apply`              | both      | `AdvancedDateModel<TDate>`               | Fired when Apply is used with `autoApply=false`                        |
| `cancel`             | both      | none                                     | Fired from picker cancel flows, including `Escape` inside the calendar |
| `inputCommit`        | input     | `AdvancedDateInputCommitPayload<TDate>`  | Fired when a text or picker draft commits                              |
| `inputInvalid`       | input     | `AdvancedDateInputInvalidPayload<TDate>` | Fired when commit validation fails                                     |
| `draftClose`         | input     | `AdvancedDateInputClosePayload<TDate>`   | Fired after an overlay close attempt resolves or is blocked            |
| `presetSelect`       | both      | `PresetRange<TDate>`                     | Fired when a preset is chosen                                          |

### Slots

All picker slots can be passed either directly to `VAdvancedDatePicker` or through `VAdvancedDateInput`, which forwards them to the internal picker.

| Slot            | Component | Slot props                                                                                    |
| --------------- | --------- | --------------------------------------------------------------------------------------------- |
| `activator`     | input     | `{ props, isOpen }`                                                                           |
| `day`           | both      | `{ date, outside, disabled, today, selected, rangeStart, rangeEnd, inRange, preview, props }` |
| `preset`        | both      | `{ preset, active, disabled, props }`                                                         |
| `preset-<name>` | both      | Same as `preset`, selected when `preset.slot === '<name>'`                                    |
| `actions`       | both      | `{ apply, cancel, disabled }`                                                                 |

When overriding `day`, spread the provided `props` onto your interactive element to preserve keyboard and ARIA behavior.

### Exposed Picker Methods

A `ref` on `VAdvancedDatePicker` exposes these methods:

| Method              | Description                                     |
| ------------------- | ----------------------------------------------- |
| `focusDate(date)`   | Navigates if needed and focuses a specific date |
| `focusActiveDate()` | Focuses the active or first available date      |
| `prevMonth()`       | Moves to the previous visible month             |
| `nextMonth()`       | Moves to the next visible month                 |

### Exposed Input Methods

A `ref` on `VAdvancedDateInput` exposes the `AdvancedDateInputPublicInstance<TDate>` handle:

| Member              | Type                            | Description                                                      |
| ------------------- | ------------------------------- | ---------------------------------------------------------------- |
| `commitInput()`     | `() => Promise<boolean>`        | Validates the current draft and commits it when possible         |
| `validate()`        | `() => Promise<string[]>`       | Runs draft validation and returns the current messages           |
| `resetValidation()` | `() => Promise<void>`           | Clears parse and rule validation state                           |
| `revertDraft()`     | `() => void`                    | Restores the committed value and formatted text                  |
| `text`              | `string`                        | Current visible input text                                       |
| `draft`             | `AdvancedDateInputDraft<TDate>` | Current draft snapshot                                           |
| `isDirty`           | `boolean`                       | Whether the current text differs from the committed display text |
| `isPristine`        | `boolean`                       | Whether the field has avoided validation so far                  |
| `isValid`           | `boolean \| null`               | `null` while pristine, then the current validation state         |
| `errorMessages`     | `string[]`                      | Current merged parse and field-rule errors                       |

## Styling and Theming

Import `@gigerit/vuetify-date-input-advanced/style.css` once. The picker uses `.v-advanced-date-picker` as its root class. The input wrapper uses `.v-advanced-date-input`.

Key CSS custom properties:

| Variable                             | Default                                        | Purpose                    |
| ------------------------------------ | ---------------------------------------------- | -------------------------- |
| `--v-advanced-date-picker-color`     | `rgb(var(--v-theme-primary))`                  | Accent color               |
| `--v-advanced-date-range-bg`         | computed                                       | Confirmed range background |
| `--v-advanced-date-range-preview-bg` | computed                                       | Hover-preview background   |
| `--v-advanced-date-selected-bg`      | `var(--v-advanced-date-picker-color)`          | Selected day background    |
| `--v-advanced-date-selected-color`   | `rgb(var(--v-theme-on-primary))`               | Selected day text color    |
| `--v-advanced-date-preset-width`     | `220px`                                        | Preset column width        |
| `--v-advanced-date-cell-size`        | `40px`                                         | Calendar cell size         |
| `--v-advanced-date-day-size`         | `calc(var(--v-advanced-date-cell-size) - 4px)` | Day button size            |
| `--v-advanced-date-day-inset`        | computed                                       | Range background inset     |
| `--v-advanced-date-gap`              | `24px`                                         | Gap between visible months |

Example:

```css
.booking-picker {
  --v-advanced-date-preset-width: 18rem;
  --v-advanced-date-cell-size: 44px;
  --v-advanced-date-picker-color: rgb(var(--v-theme-secondary));
}
```

The `color` prop updates the emphasis color by setting `--v-advanced-date-picker-color` from the active Vuetify theme.

## Accessibility and Keyboard

The current implementation includes:

- Per-day `aria-label`, `aria-selected`, `aria-disabled`, and `aria-current="date"`
- A live region that announces visible months and selected values
- Roving focus across day buttons
- Keyboard navigation on the calendar grid

Keyboard shortcuts:

| Key                               | Behavior                                                           |
| --------------------------------- | ------------------------------------------------------------------ |
| `ArrowLeft` / `ArrowRight`        | Move 1 day                                                         |
| `ArrowUp` / `ArrowDown`           | Move 1 week                                                        |
| `Home` / `End`                    | Move to start or end of the current week based on `firstDayOfWeek` |
| `PageUp` / `PageDown`             | Move 1 month                                                       |
| `Shift+PageUp` / `Shift+PageDown` | Move 1 year                                                        |
| `Enter` / `Space`                 | Select active day                                                  |
| `Escape`                          | Cancel picker interaction                                          |

## Development

Repository layout:

- `src/`: components, composables, utilities, styles, and plugin entry
- `playground/`: local Vite app for manual QA
- `tests/`: Vitest and Vue Test Utils coverage
- `dist/`: generated build output

Useful scripts:

```sh
npm install
npm run dev
npm run typecheck
npm run test
npm run lint
npm run build
npm run format
```

## CI

GitHub Actions now validates the repo automatically with `.github/workflows/ci.yml`.

- pull requests to `main`, pushes to `main`, and manual `workflow_dispatch` runs execute the same core checks used locally
- the workflow installs dependencies with `npm ci` and runs `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`
- the job uses Node `22.x`, matching the current release pipeline runtime
- in-progress runs for the same ref are canceled when a newer commit is pushed

Before opening a PR, the matching local safety check is:

```sh
npm run typecheck
npm run lint
npm run test
npm run build
```

## Releases

Releases are automated from `.github/workflows/release.yml`.

- `.github/workflows/ci.yml` handles routine validation for pushes and pull requests
- `googleapis/release-please-action` opens and maintains the release PR from conventional commits on `main`
- when that release PR is merged, GitHub Actions builds, validates, and publishes the package to npm with provenance
- npm publishing is configured for trusted publishing via GitHub OIDC, so no long-lived `NPM_TOKEN` is required in the workflow

Because npm trusted publishers can only be configured for packages that already exist on the registry, the first publish still has to be done manually by an authenticated maintainer.

After the initial publish, configure the package as a trusted publisher for this repository and workflow in npm, or with npm CLI v11.10.0+:

```sh
npm trust github @gigerit/vuetify-date-input-advanced \
  --repo gigerIT/vuetify-date-input-advanced \
  --file .github/workflows/release.yml
```

Verified from the repository configuration:

- The library is built with Vite in library mode
- Output formats are ESM and CommonJS
- Declaration files are generated from `src/`
- Styles are exported as `@gigerit/vuetify-date-input-advanced/style.css`
- Tests run in `jsdom` with Vuetify bootstrapped in Vue Test Utils

## Notes

- Examples in this README use native `Date`, but the actual value type follows your configured Vuetify date adapter.
- Default package icons use Vuetify aliases (`$calendar`, `$prev`, `$next`) so they follow your app's official Vuetify icon configuration.
