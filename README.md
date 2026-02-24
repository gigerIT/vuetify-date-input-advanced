# @gigerit/vuetify-date-input-advanced

Advanced date input package for Vuetify 4 with multi-month rendering, presets, range hover preview, swipe navigation, and fullscreen mobile UX.

## Install

```bash
npm install @gigerit/vuetify-date-input-advanced
```

## Usage

```ts
import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import DateInputAdvancedPlugin from '@gigerit/vuetify-date-input-advanced'
import '@gigerit/vuetify-date-input-advanced/styles'

const app = createApp(App)
const vuetify = createVuetify()

app.use(vuetify)
app.use(DateInputAdvancedPlugin)
```

```vue
<v-date-input-advanced
  v-model="range"
  :months="2"
  show-presets
  label="Select date range"
/>
```

## Local playground

```bash
npm run dev
```

This starts `playground/` and aliases package imports to `src/index.ts` and `src/styles/main.scss`, so edits in the library update instantly in the showcase app.

## Exports

- `VDateInputAdvanced` (`<v-date-input-advanced>`)
- `VDatePickerAdvanced`
- `createDateInputAdvanced()` plugin factory
- `DateInputAdvancedPlugin` default export
