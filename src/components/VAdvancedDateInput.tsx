import type { PropType } from 'vue'
import { computed, defineComponent, ref, toRef, watch } from 'vue'

import { VDialog, VMenu, VTextField } from 'vuetify/components'
import { useDate, useDisplay } from 'vuetify'

import { useAdvancedDateInput } from '@/composables/useAdvancedDateInput'
import type { AdvancedDateAdapter, AdvancedDateModel, PresetRange } from '@/types'
import { normalizeModel } from '@/util/model'

import '@/styles/VAdvancedDateInput.sass'

import { VAdvancedDatePicker } from './VAdvancedDatePicker'

function shouldCloseOnSelection<TDate>(
  adapter: AdvancedDateAdapter<TDate>,
  modelValue: AdvancedDateModel<TDate>,
  range: boolean,
): boolean {
  const selection = normalizeModel(adapter, modelValue, range)
  if (!range) return !!selection.start
  return !!selection.start && !!selection.end
}

export const VAdvancedDateInput = defineComponent({
  name: 'VAdvancedDateInput',

  props: {
    modelValue: {
      type: [Object, Array, Date, String, Number] as PropType<AdvancedDateModel<unknown>>,
      default: null,
    },
    menu: Boolean,
    inline: Boolean,
    label: String,
    placeholder: String,
    variant: {
      type: String,
      default: 'outlined',
    },
    hideDetails: {
      type: [Boolean, String] as PropType<boolean | 'auto'>,
      default: 'auto',
    },
    messages: {
      type: [String, Array] as PropType<string | string[]>,
      default: undefined,
    },
    error: Boolean,
    errorMessages: {
      type: [String, Array] as PropType<string | string[]>,
      default: undefined,
    },
    rules: {
      type: Array as PropType<readonly unknown[]>,
      default: () => [],
    },
    clearable: Boolean,
    focused: Boolean,
    prependInnerIcon: String,
    appendInnerIcon: {
      type: String,
      default: 'mdi-calendar',
    },
    range: {
      type: Boolean,
      default: true,
    },
    returnObject: Boolean,
    months: {
      type: Number,
      default: 2,
    },
    month: Number,
    year: Number,
    presets: Array as PropType<PresetRange<unknown>[]>,
    showPresets: {
      type: Boolean,
      default: true,
    },
    swipeable: {
      type: Boolean,
      default: true,
    },
    autoApply: {
      type: Boolean,
      default: true,
    },
    min: {
      type: [Object, Date, String, Number] as PropType<unknown>,
      default: null,
    },
    max: {
      type: [Object, Date, String, Number] as PropType<unknown>,
      default: null,
    },
    allowedDates: Function as PropType<(date: unknown) => boolean>,
    showWeekNumbers: Boolean,
    displayFormat: {
      type: String,
      default: 'fullDate',
    },
    rangeSeparator: {
      type: String,
      default: ' – ',
    },
    parseInput: Function as PropType<(value: string) => unknown | null>,
    disabled: Boolean,
    readonly: Boolean,
    color: {
      type: String,
      default: 'primary',
    },
    theme: String,
    rounded: {
      type: [String, Number, Boolean],
      default: 'xl',
    },
    border: {
      type: [String, Number, Boolean],
      default: true,
    },
    elevation: {
      type: [String, Number],
      default: 2,
    },
    width: [String, Number],
    minWidth: [String, Number],
    maxWidth: [String, Number],
    density: {
      type: String as PropType<'default' | 'comfortable' | 'compact'>,
      default: 'default',
    },
  },

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
    const menu = ref(props.menu)

    watch(
      () => props.menu,
      value => {
        menu.value = value
      },
    )

    const input = useAdvancedDateInput({
      adapter,
      modelValue: toRef(props, 'modelValue'),
      range: toRef(props, 'range'),
      returnObject: toRef(props, 'returnObject'),
      displayFormat: toRef(props, 'displayFormat'),
      rangeSeparator: toRef(props, 'rangeSeparator'),
      parseInput: toRef(props, 'parseInput'),
      onUpdate: value => emit('update:modelValue', value),
    })

    const mergedErrorMessages = computed(() => {
      const base = Array.isArray(props.errorMessages)
        ? props.errorMessages
        : props.errorMessages ? [props.errorMessages] : []

      return [...base, ...input.errorMessages.value]
    })

    function setMenu(value: boolean) {
      menu.value = value
      emit('update:menu', value)
    }

    function handlePickerUpdate(value: AdvancedDateModel<unknown>) {
      emit('update:modelValue', value)
      if (!props.inline && props.autoApply && shouldCloseOnSelection(adapter, value, props.range)) {
        setMenu(false)
      }
    }

    function handleApply(value: AdvancedDateModel<unknown>) {
      emit('apply', value)
      setMenu(false)
    }

    function handleCancel() {
      emit('cancel')
      setMenu(false)
    }

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Enter') {
        if (!input.commitInput()) return
        setMenu(true)
      }

      if (event.key === 'Escape') setMenu(false)
    }

    const pickerProps = computed(() => ({
      modelValue: props.modelValue,
      range: props.range,
      returnObject: props.returnObject,
      months: props.months,
      month: props.month,
      year: props.year,
      presets: props.presets,
      showPresets: props.showPresets,
      swipeable: props.swipeable,
      autoApply: props.autoApply,
      min: props.min,
      max: props.max,
      allowedDates: props.allowedDates,
      showWeekNumbers: props.showWeekNumbers,
      disabled: props.disabled,
      readonly: props.readonly,
      color: props.color,
      theme: props.theme,
      rounded: props.rounded,
      border: props.border,
      elevation: props.elevation,
      width: props.width,
      minWidth: props.minWidth,
      maxWidth: props.maxWidth,
      density: props.density,
    }))

    function renderPicker() {
      return (
        <VAdvancedDatePicker
          {...pickerProps.value}
          onUpdate:modelValue={handlePickerUpdate}
          onUpdate:month={value => emit('update:month', value)}
          onUpdate:year={value => emit('update:year', value)}
          onApply={handleApply}
          onCancel={handleCancel}
          onPresetSelect={preset => emit('presetSelect', preset)}
          v-slots={slots}
        />
      )
    }

    function renderField() {
      if (slots.activator) {
        return slots.activator({
          props: {
            onClick: () => setMenu(true),
          },
          isOpen: menu.value,
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
            variant: props.variant,
            hideDetails: props.hideDetails,
            messages: props.messages,
            error: props.error || !!input.inputError.value,
            errorMessages: mergedErrorMessages.value,
            rules: props.rules,
            clearable: props.clearable,
            focused: props.focused,
            disabled: props.disabled,
            readonly: props.readonly,
            prependInnerIcon: props.prependInnerIcon,
            appendInnerIcon: props.appendInnerIcon,
            density: props.density,
            onFocus: input.onFocus,
            onBlur: input.onBlur,
            onKeydown: handleKeydown,
            'onClick:control': () => setMenu(true),
            'onClick:appendInner': () => setMenu(true),
            'onClick:clear': () => {
              input.setText('')
              input.commitInput()
              setMenu(false)
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
            <VDialog v-model={menu.value} maxWidth="960">
              {renderPicker()}
            </VDialog>
          </div>
        )
      }

      return (
        <VMenu v-model={menu.value} closeOnContentClick={false} offset={8}>
          {{
            activator: () => renderField(),
            default: () => renderPicker(),
          }}
        </VMenu>
      )
    }
  },
})
