<template>
  <div
    class="v-advanced-date-presets"
    :class="{
      'v-advanced-date-presets--horizontal': horizontal,
      'v-advanced-date-presets--vertical': !horizontal,
    }"
    role="listbox"
    aria-label="Date range presets"
  >
    <button
      v-for="(preset, index) in presets"
      :key="index"
      class="v-advanced-date-presets__item"
      :class="{
        'v-advanced-date-presets__item--active': activeIndex === index,
      }"
      role="option"
      :aria-selected="activeIndex === index"
      @click="$emit('select', preset)"
    >
      <slot name="preset" :preset="preset" :active="activeIndex === index">
        <span class="v-advanced-date-presets__label">{{ preset.label }}</span>
      </slot>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { PresetRange } from '../../types'

withDefaults(defineProps<{
  presets: PresetRange[]
  activeIndex?: number
  horizontal?: boolean
}>(), {
  activeIndex: -1,
  horizontal: false,
})

defineEmits<{
  select: [preset: PresetRange]
}>()
</script>
