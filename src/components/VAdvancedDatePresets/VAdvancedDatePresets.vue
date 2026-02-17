<template>
  <!-- Horizontal chip row (mobile fullscreen) -->
  <div v-if="horizontal" class="v-advanced-date-presets--horizontal">
    <v-chip-group>
      <v-chip
        v-for="(preset, index) in presets"
        :key="index"
        :active="activeIndex === index"
        :variant="activeIndex === index ? 'flat' : 'outlined'"
        :color="activeIndex === index ? 'primary' : undefined"
        size="small"
        @click="$emit('select', preset)"
      >
        <slot name="preset" :preset="preset" :active="activeIndex === index">
          {{ preset.label }}
        </slot>
      </v-chip>
    </v-chip-group>
  </div>

  <!-- Vertical list sidebar (desktop) -->
  <v-list
    v-else
    class="v-advanced-date-presets--vertical"
    density="compact"
    nav
    role="listbox"
    aria-label="Date range presets"
  >
    <v-list-item
      v-for="(preset, index) in presets"
      :key="index"
      :active="activeIndex === index"
      color="primary"
      role="option"
      :aria-selected="activeIndex === index"
      @click="$emit('select', preset)"
    >
      <slot name="preset" :preset="preset" :active="activeIndex === index">
        <v-list-item-title class="text-body-2">{{ preset.label }}</v-list-item-title>
      </slot>
    </v-list-item>
  </v-list>
</template>

<script setup lang="ts">
import type { PresetRange } from '../../types'
import { VList, VListItem, VListItemTitle } from 'vuetify/components/VList'
import { VChip } from 'vuetify/components/VChip'
import { VChipGroup } from 'vuetify/components/VChipGroup'

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
