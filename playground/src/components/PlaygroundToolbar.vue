<script setup lang="ts">
import type { PlaygroundLocale, SelectOption, ThemeMode } from '../playgroundTypes'

defineProps<{
  themeModeOptions: SelectOption<ThemeMode>[]
  localeOptions: SelectOption<PlaygroundLocale>[]
}>()

const themeMode = defineModel<ThemeMode>('themeMode', { required: true })
const playgroundLocale = defineModel<PlaygroundLocale>('playgroundLocale', {
  required: true,
})
</script>

<template>
  <v-card variant="flat">
    <v-card-text>
      <div class="playground-controls-row">
        <v-select
          v-model="themeMode"
          label="Theme"
          :items="themeModeOptions"
          item-title="title"
          item-value="value"
          density="comfortable"
          hide-details
          variant="outlined"
          prepend-inner-icon="mdi-theme-light-dark"
        />

        <v-select
          v-model="playgroundLocale"
          label="Locale"
          :items="localeOptions"
          item-title="title"
          item-value="value"
          density="comfortable"
          hide-details
          variant="outlined"
          prepend-inner-icon="mdi-translate"
        />
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.playground-controls-row {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
</style>
