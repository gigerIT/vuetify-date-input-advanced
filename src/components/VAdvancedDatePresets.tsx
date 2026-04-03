import type { PropType } from 'vue'
import { defineComponent } from 'vue'

import { VList, VListItem, VListItemTitle } from 'vuetify/components'

import type { PresetRange } from '@/types'

export const VAdvancedDatePresets = defineComponent({
  name: 'VAdvancedDatePresets',

  props: {
    presets: {
      type: Array as PropType<PresetRange<unknown>[]>,
      default: () => [],
    },
    disabled: Boolean,
    isActive: {
      type: Function as PropType<(preset: PresetRange<unknown>) => boolean>,
      required: true,
    },
  },

  emits: {
    select: (_preset: PresetRange<unknown>) => true,
  },

  setup(props, { emit, slots }) {
    return () => {
      if (!props.presets.length) return null

      return (
        <VList class="v-advanced-date-picker__presets" density="compact" nav>
          {props.presets.map(preset => {
            const active = props.isActive(preset)
            const slotName = preset.slot ? `preset-${preset.slot}` : 'preset'
            const slot = slots[slotName] ?? slots.preset

            return (
              <VListItem
                key={preset.label}
                active={active}
                disabled={props.disabled}
                class="v-advanced-date-picker__preset"
                onClick={() => emit('select', preset)}
              >
                {slot?.({
                  preset,
                  active,
                  props: {
                    onClick: () => emit('select', preset),
                  },
                }) ?? <VListItemTitle>{preset.label}</VListItemTitle>}
              </VListItem>
            )
          })}
        </VList>
      )
    }
  },
})
