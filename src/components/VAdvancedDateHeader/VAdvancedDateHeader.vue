<template>
  <div class="v-advanced-date-header" role="heading" aria-level="2">
    <v-btn
      v-if="showPrev"
      icon
      variant="text"
      size="small"
      :disabled="!canGoBack"
      aria-label="Previous month"
      @click="$emit('prev')"
    >
      <v-icon>mdi-chevron-left</v-icon>
    </v-btn>
    <div v-else class="v-advanced-date-header__nav-spacer" />

    <div class="v-advanced-date-header__title">
      <span class="v-advanced-date-header__month">
        {{ monthName }}
      </span>
      <v-btn
        v-if="!hideYearMenu"
        variant="text"
        size="small"
        density="comfortable"
        slim
        :aria-label="`Change year, currently ${year}`"
        @click="$emit('year-click')"
      >
        {{ year }}
        <v-icon end size="small">mdi-menu-down</v-icon>
      </v-btn>
      <span v-else class="v-advanced-date-header__year-static">
        {{ year }}
      </span>
    </div>

    <v-btn
      v-if="showNext"
      icon
      variant="text"
      size="small"
      :disabled="!canGoForward"
      aria-label="Next month"
      @click="$emit('next')"
    >
      <v-icon>mdi-chevron-right</v-icon>
    </v-btn>
    <div v-else class="v-advanced-date-header__nav-spacer" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { VBtn } from 'vuetify/components/VBtn'
import { VIcon } from 'vuetify/components/VIcon'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const props = withDefaults(defineProps<{
  year: number
  month: number
  showPrev?: boolean
  showNext?: boolean
  canGoBack?: boolean
  canGoForward?: boolean
  hideYearMenu?: boolean
}>(), {
  showPrev: true,
  showNext: true,
  canGoBack: true,
  canGoForward: true,
  hideYearMenu: false,
})

defineEmits<{
  prev: []
  next: []
  'year-click': []
}>()

const monthName = computed(() => MONTH_NAMES[props.month])
</script>
