<script setup lang="ts">
import PlaygroundAdvancedTab from './components/PlaygroundAdvancedTab.vue'
import PlaygroundExamplesTab from './components/PlaygroundExamplesTab.vue'
import PlaygroundLabTab from './components/PlaygroundLabTab.vue'
import PlaygroundToolbar from './components/PlaygroundToolbar.vue'
import { usePlaygroundState } from './composables/usePlaygroundState'

const {
  currentTab,
  localeOptions,
  playgroundLocale,
  tabOptions,
  themeMode,
  themeModeOptions,
} = usePlaygroundState()
</script>

<template>
  <v-app>
    <v-main>
      <v-container max-width="1600" class="playground-shell py-8">
        <div class="playground-shell__header">
          <div class="playground-shell__title">
            <div class="text-overline playground-shell__eyebrow">Library Playground</div>
            <h1 class="text-h4 font-weight-bold mb-2">
              Vuetify Advanced Date Picker
            </h1>
            <p class="text-body-1 text-medium-emphasis mb-0">
              Start with the clean examples, then move into the full prop lab or
              the regression-heavy advanced scenarios.
            </p>
          </div>

          <PlaygroundToolbar
            v-model:theme-mode="themeMode"
            v-model:playground-locale="playgroundLocale"
            :theme-mode-options="themeModeOptions"
            :locale-options="localeOptions"
          />
        </div>

        <v-card class="playground-shell__tabs" variant="flat">
          <v-tabs
            v-model="currentTab"
            align-tabs="start"
            color="primary"
            density="comfortable"
            grow
          >
            <v-tab
              v-for="tab in tabOptions"
              :key="tab.value"
              :value="tab.value"
            >
              {{ tab.title }}
            </v-tab>
          </v-tabs>
        </v-card>

        <v-window v-model="currentTab" class="mt-6">
          <v-window-item value="examples">
            <PlaygroundExamplesTab />
          </v-window-item>
          <v-window-item value="playground">
            <PlaygroundLabTab />
          </v-window-item>
          <v-window-item value="advanced">
            <PlaygroundAdvancedTab />
          </v-window-item>
        </v-window>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.playground-shell {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.playground-shell__header {
  display: grid;
  gap: 20px;
  grid-template-columns: minmax(0, 1.6fr) minmax(320px, 0.9fr);
  align-items: start;
}

.playground-shell__eyebrow {
  letter-spacing: 0.12em;
  color: rgba(var(--v-theme-primary), 0.9);
}

.playground-shell__tabs {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

@media (max-width: 960px) {
  .playground-shell__header {
    grid-template-columns: 1fr;
  }
}
</style>
