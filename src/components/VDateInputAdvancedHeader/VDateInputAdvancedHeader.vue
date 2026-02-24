<script setup lang="ts">
interface HeaderMonth {
  month: number
  year: number
  label: string
}

defineProps<{
  months: HeaderMonth[]
  canGoPrev: boolean
  canGoNext: boolean
}>()

const emit = defineEmits<{
  (e: 'prev'): void
  (e: 'next'): void
}>()
</script>

<template>
  <div class="v-date-input-advanced-header">
    <VBtn
      icon="$prev"
      variant="text"
      density="comfortable"
      :disabled="!canGoPrev"
      @click="emit('prev')"
    />

    <div class="v-date-input-advanced-header__labels">
      <div
        v-for="month in months"
        :key="`${month.year}-${month.month}`"
        class="v-date-input-advanced-header__label"
      >
        {{ month.label }}
      </div>
    </div>

    <VBtn
      icon="$next"
      variant="text"
      density="comfortable"
      :disabled="!canGoNext"
      @click="emit('next')"
    />
  </div>
</template>

<style lang="scss">
@layer vuetify-date-input-advanced {
  .v-date-input-advanced-header {
    align-items: center;
    display: grid;
    gap: 8px;
    grid-template-columns: auto 1fr auto;
    min-height: 48px;
  }

  .v-date-input-advanced-header__labels {
    display: grid;
    gap: 12px;
    grid-auto-flow: column;
    grid-auto-columns: minmax(0, 1fr);
    text-align: center;
  }

  .v-date-input-advanced-header__label {
    font-weight: 600;
    line-height: 1.2;
    white-space: nowrap;
  }
}
</style>
