<script setup lang="ts">
import type { ResolvedPresetRange } from '@/types'

const props = defineProps<{
  presets: ResolvedPresetRange[]
  activeIndex: number
  mobile: boolean
}>()

const emit = defineEmits<{
  (e: 'select', preset: ResolvedPresetRange): void
}>()

const onSelect = (preset: ResolvedPresetRange) => {
  emit('select', preset)
}
</script>

<template>
  <div class="v-date-input-advanced-presets" :class="{ 'is-mobile': mobile }">
    <template v-if="mobile">
      <div class="v-date-input-advanced-presets__chips" role="listbox" aria-label="Date presets">
        <VChip
          v-for="(preset, index) in props.presets"
          :key="preset.label"
          :variant="index === activeIndex ? 'flat' : 'outlined'"
          :color="index === activeIndex ? 'primary' : undefined"
          size="small"
          @click="onSelect(preset)"
        >
          <slot name="preset" :preset="preset" :active="index === activeIndex">
            {{ preset.label }}
          </slot>
        </VChip>
      </div>
    </template>

    <template v-else>
      <VList density="compact" nav>
        <VListItem
          v-for="(preset, index) in props.presets"
          :key="preset.label"
          :active="index === activeIndex"
          @click="onSelect(preset)"
        >
          <VListItemTitle>
            <slot name="preset" :preset="preset" :active="index === activeIndex">
              {{ preset.label }}
            </slot>
          </VListItemTitle>
        </VListItem>
      </VList>
    </template>
  </div>
</template>

<style lang="scss">
@layer vuetify-date-input-advanced {
  .v-date-input-advanced-presets {
    min-inline-size: var(--v-date-input-advanced-sidebar-width, 180px);
  }

  .v-date-input-advanced-presets.is-mobile {
    min-inline-size: 0;
    overflow: auto hidden;
  }

  .v-date-input-advanced-presets__chips {
    display: grid;
    gap: 8px;
    grid-auto-flow: column;
    justify-content: start;
    padding: 4px 0;
    scroll-snap-type: x mandatory;
  }

  .v-date-input-advanced-presets__chips > * {
    scroll-snap-align: start;
  }
}
</style>
