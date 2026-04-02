import { defineComponent } from 'vue'

import { VBtn } from 'vuetify/components'

export const VAdvancedDateActions = defineComponent({
  name: 'VAdvancedDateActions',

  props: {
    disabled: Boolean,
  },

  emits: {
    apply: () => true,
    cancel: () => true,
  },

  setup(props, { emit, slots }) {
    return () => {
      if (slots.actions) {
        return (
          <div class="v-advanced-date-picker__actions">
            {slots.actions({
              apply: () => emit('apply'),
              cancel: () => emit('cancel'),
              disabled: props.disabled,
            })}
          </div>
        )
      }

      return (
        <div class="v-advanced-date-picker__actions">
          <VBtn {...({ variant: 'text', onClick: () => emit('cancel') } as any)}>
            Cancel
          </VBtn>
          <VBtn
            {...({ color: 'primary', variant: 'flat', disabled: props.disabled, onClick: () => emit('apply') } as any)}
          >
            Apply
          </VBtn>
        </div>
      )
    }
  },
})
