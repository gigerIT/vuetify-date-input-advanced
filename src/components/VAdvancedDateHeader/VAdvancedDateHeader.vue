<template>
  <div class="v-advanced-date-header" role="heading" aria-level="2">
    <button
      v-if="showPrev"
      class="v-advanced-date-header__nav v-advanced-date-header__nav--prev"
      :disabled="!canGoBack"
      aria-label="Previous month"
      @click="$emit('prev')"
    >
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor" />
      </svg>
    </button>
    <div v-else class="v-advanced-date-header__nav-spacer" />

    <div class="v-advanced-date-header__title">
      <span class="v-advanced-date-header__month">
        {{ monthName }}
      </span>
      <button
        v-if="!hideYearMenu"
        class="v-advanced-date-header__year-btn"
        :aria-label="`Change year, currently ${year}`"
        @click="$emit('year-click')"
      >
        {{ year }}
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" class="v-advanced-date-header__year-icon">
          <path d="M7 10l5 5 5-5z" fill="currentColor" />
        </svg>
      </button>
      <span v-else class="v-advanced-date-header__year-static">
        {{ year }}
      </span>
    </div>

    <button
      v-if="showNext"
      class="v-advanced-date-header__nav v-advanced-date-header__nav--next"
      :disabled="!canGoForward"
      aria-label="Next month"
      @click="$emit('next')"
    >
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor" />
      </svg>
    </button>
    <div v-else class="v-advanced-date-header__nav-spacer" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

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
