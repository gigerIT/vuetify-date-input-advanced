import { computed, defineComponent, ref, toRef } from 'vue'

import { VDialog, VMenu, VTextField } from 'vuetify/components'
import { useDate, useDisplay } from 'vuetify'

import { useAdvancedDateInput } from '@/composables/useAdvancedDateInput'
import { useAdvancedDateOverlay } from '@/composables/useAdvancedDateOverlay'
import type {
  AdvancedDateAdapter,
  AdvancedDateModel,
  PresetRange,
} from '@/types'

import '@/styles/VAdvancedDateInput.sass'

import {
  advancedDateInputProps,
  buildAdvancedDatePickerBindings,
  type AdvancedDateMobilePresentation,
} from './advancedDateProps'
import { VAdvancedDatePicker } from './VAdvancedDatePicker'

interface OverlayActivatorProps {
  [key: string]: unknown
}

export const VAdvancedDateInput = defineComponent({
  name: 'VAdvancedDateInput',

  props: advancedDateInputProps,

  emits: {
    'update:modelValue': (_value: AdvancedDateModel<unknown>) => true,
    'update:menu': (_value: boolean) => true,
    'update:month': (_value: number) => true,
    'update:year': (_value: number) => true,
    apply: (_value: AdvancedDateModel<unknown>) => true,
    cancel: () => true,
    presetSelect: (_preset: PresetRange<unknown>) => true,
  },

  setup(props, { emit, slots }) {
    const adapter = useDate() as AdvancedDateAdapter<unknown>
    const display = useDisplay()
    const pickerRef = ref<{ focusActiveDate?: () => void } | null>(null)
    const mobilePresentation = computed<AdvancedDateMobilePresentation | null>(
      () =>
        display.mobile.value && !props.inline ? 'fullscreen' : 'inline',
    )

    const input = useAdvancedDateInput({
      adapter,
      modelValue: toRef(props, 'modelValue'),
      range: toRef(props, 'range'),
      returnObject: toRef(props, 'returnObject'),
      displayFormat: toRef(props, 'displayFormat'),
      rangeSeparator: toRef(props, 'rangeSeparator'),
      parseInput: toRef(props, 'parseInput'),
      min: toRef(props, 'min'),
      max: toRef(props, 'max'),
      allowedDates: toRef(props, 'allowedDates'),
      allowedStartDates: toRef(props, 'allowedStartDates'),
      allowedEndDates: toRef(props, 'allowedEndDates'),
      onUpdate: (value) => emit('update:modelValue', value),
    })
    const overlay = useAdvancedDateOverlay({
      adapter,
      menu: toRef(props, 'menu'),
      inline: toRef(props, 'inline'),
      autoApply: toRef(props, 'autoApply'),
      range: toRef(props, 'range'),
      pickerRef,
      onMenuUpdate: (value) => emit('update:menu', value),
      onModelUpdate: (value) => emit('update:modelValue', value),
      onApply: (value) => emit('apply', value),
      onCancel: () => emit('cancel'),
    })

    const mergedErrorMessages = computed(() => {
      const base = Array.isArray(props.errorMessages)
        ? props.errorMessages
        : props.errorMessages
          ? [props.errorMessages]
          : []

      return [...base, ...input.errorMessages.value]
    })
    const pickerBindings = computed(() =>
      buildAdvancedDatePickerBindings(props, mobilePresentation.value),
    )

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Enter') {
        if (!input.commitInput()) return
        overlay.setMenu(true)
      }

      if (event.key === 'Escape') overlay.setMenu(false)
    }

    function renderPicker() {
      return (
        <VAdvancedDatePicker
          ref={pickerRef}
          {...pickerBindings.value}
          onUpdate:modelValue={overlay.handlePickerUpdate}
          onUpdate:month={(value) => emit('update:month', value)}
          onUpdate:year={(value) => emit('update:year', value)}
          onApply={overlay.handleApply}
          onCancel={overlay.handleCancel}
          onPresetSelect={(preset) => emit('presetSelect', preset)}
          v-slots={slots}
        />
      )
    }

    function renderField(activatorProps: OverlayActivatorProps = {}) {
      const hasActivatorProps = Object.keys(activatorProps).length > 0

      if (slots.activator) {
        return slots.activator({
          props: {
            ...activatorProps,
            onClick: () => overlay.setMenu(true),
          },
          isOpen: overlay.menu.value,
        })
      }

      return (
        <VTextField
          {...({
            class: 'v-advanced-date-input',
            modelValue: input.text.value,
            'onUpdate:modelValue': input.setText,
            label: props.label,
            placeholder: props.placeholder,
            autocomplete: 'off',
            variant: props.variant,
            hideDetails: props.hideDetails,
            messages: props.messages,
            error: props.error || !!input.inputError.value,
            errorMessages: mergedErrorMessages.value,
            rules: props.rules,
            clearable: props.clearable,
            focused: props.focused,
            'aria-expanded': overlay.menu.value,
            disabled: props.disabled,
            readonly: props.readonly,
            prependInnerIcon: props.prependInnerIcon,
            appendInnerIcon: props.appendInnerIcon,
            density: props.density,
            ...activatorProps,
            onFocus: input.onFocus,
            onBlur: input.onBlur,
            onKeydown: handleKeydown,
            'onClick:control': () => {
              if (!hasActivatorProps) overlay.setMenu(true)
            },
            'onClick:appendInner': () => {
              if (!hasActivatorProps) overlay.setMenu(true)
            },
            'onClick:clear': () => {
              input.setText('')
              input.commitInput()
              overlay.setMenu(false)
            },
          } as any)}
        />
      )
    }

    return () => {
      if (props.inline) return renderPicker()

      if (display.mobile.value) {
        return (
          <div class="v-advanced-date-input-shell">
            {renderField()}
            <VDialog
              modelValue={overlay.menu.value}
              onUpdate:modelValue={overlay.setMenu}
              fullscreen
            >
              {renderPicker()}
            </VDialog>
          </div>
        )
      }

      return (
        <VMenu
          modelValue={overlay.menu.value}
          onUpdate:modelValue={overlay.setMenu}
          closeOnContentClick={false}
          offset={8}
          minWidth={props.minWidth ?? 0}
        >
          {{
            activator: ({
              props: activatorProps,
            }: {
              props: OverlayActivatorProps
            }) => renderField(activatorProps),
            default: () => renderPicker(),
          }}
        </VMenu>
      )
    }
  },
})
