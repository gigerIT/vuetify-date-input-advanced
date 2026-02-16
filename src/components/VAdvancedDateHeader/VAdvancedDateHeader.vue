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
      <v-menu
        v-if="!hideYearMenu"
        v-model="yearMenuOpen"
        :close-on-content-click="false"
        location="bottom center"
        :offset="4"
      >
        <template #activator="{ props: menuProps }">
          <v-btn
            v-bind="menuProps"
            variant="text"
            size="small"
            density="comfortable"
            slim
            :aria-label="`Change year, currently ${year}`"
          >
            {{ year }}
            <v-icon end size="small">mdi-menu-down</v-icon>
          </v-btn>
        </template>
        <v-card width="280">
          <div ref="yearGridEl" class="v-advanced-date-header__year-grid">
            <v-btn
              v-for="y in yearRange"
              :key="y"
              :variant="y === year ? 'flat' : 'text'"
              :color="y === year ? 'primary' : undefined"
              size="small"
              @click="onYearSelect(y)"
            >
              {{ y }}
            </v-btn>
          </div>
        </v-card>
      </v-menu>
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
import { computed, ref, watch, nextTick } from 'vue'
import { VBtn } from 'vuetify/components/VBtn'
import { VIcon } from 'vuetify/components/VIcon'
import { VMenu } from 'vuetify/components/VMenu'
import { VCard } from 'vuetify/components/VCard'

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
  minYear?: number
  maxYear?: number
}>(), {
  showPrev: true,
  showNext: true,
  canGoBack: true,
  canGoForward: true,
  hideYearMenu: false,
  minYear: undefined,
  maxYear: undefined,
})

const emit = defineEmits<{
  prev: []
  next: []
  'year-select': [year: number]
}>()

const yearMenuOpen = ref(false)
const yearGridEl = ref<HTMLElement | null>(null)

const monthName = computed(() => MONTH_NAMES[props.month])

const yearRange = computed(() => {
  const min = props.minYear ?? (props.year - 50)
  const max = props.maxYear ?? (props.year + 50)
  const years: number[] = []
  for (let y = min; y <= max; y++) {
    years.push(y)
  }
  return years
})

// Scroll to current year when menu opens
watch(yearMenuOpen, (open) => {
  if (open) {
    nextTick(() => {
      const grid = yearGridEl.value
      if (!grid) return
      const active = grid.querySelector('.v-btn--variant-flat') as HTMLElement
      active?.scrollIntoView({ block: 'center' })
    })
  }
})

function onYearSelect(y: number) {
  yearMenuOpen.value = false
  emit('year-select', y)
}
</script>
