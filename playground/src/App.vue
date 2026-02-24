<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTheme } from 'vuetify'

const range = ref<unknown[] | null>(null)
const single = ref<unknown | null>(null)
const theme = useTheme()
const isDark = computed({
  get: () => theme.global.name.value === 'dark',
  set: (value: boolean) => {
    theme.global.name.value = value ? 'dark' : 'light'
  },
})

const customPresets = [
  {
    label: 'This week',
    value: () => {
      const now = new Date()
      const day = now.getDay()
      const diff = day === 0 ? -6 : 1 - day
      const start = new Date(now)
      start.setDate(now.getDate() + diff)
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      return [start, end] as [unknown, unknown]
    },
  },
  {
    label: 'This month',
    value: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      return [start, end] as [unknown, unknown]
    },
  },
]
</script>

<template>
  <v-app>
    <v-main>
      <v-container class="py-8" max-width="1100">
        <div class="d-flex align-center justify-space-between mb-4 ga-4">
          <h1 class="text-h5">VDateInputAdvanced Playground</h1>
          <v-switch
            v-model="isDark"
            color="primary"
            density="compact"
            hide-details
            inset
            :label="isDark ? 'Dark mode' : 'Light mode'"
          />
        </div>

        <v-card class="mb-6" variant="tonal">
          <v-card-title>Range + Presets + Fullscreen Auto</v-card-title>
          <v-card-text>
            <v-date-input-advanced
              v-model="range"
              label="Select report range"
              variant="outlined"
              :months="2"
              show-presets
              :presets="customPresets"
              fullscreen="auto"
            />
          </v-card-text>
        </v-card>

        <v-card class="mb-6" variant="tonal">
          <v-card-title>Single Date Mode</v-card-title>
          <v-card-text>
            <v-date-input-advanced
              v-model="single"
              :range="false"
              :months="1"
              :show-presets="false"
              label="Pick one date"
              variant="outlined"
            />
          </v-card-text>
        </v-card>

        <v-card variant="outlined">
          <v-card-title>Inline Picker</v-card-title>
          <v-card-text>
            <v-date-input-advanced
              v-model="range"
              inline
              :months="3"
              show-presets
              :auto-apply="false"
            />
          </v-card-text>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>
