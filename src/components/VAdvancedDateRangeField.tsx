import {
  defineComponent,
  nextTick,
  ref,
  type ComponentPublicInstance,
  type PropType,
} from 'vue'

import { VDivider, VInput, VTextField } from 'vuetify/components'

import type { AdvancedDateDensity } from '@/components/advancedDateProps'
import type {
  AdvancedDateIconValue,
  AdvancedDateInputField,
  AdvancedDateInputFieldProps,
} from '@/types'

interface RangeFieldHandle {
  validate?: (silent?: boolean) => Promise<string[]>
  resetValidation?: () => Promise<void>
  errorMessages?: string[]
  isValid?: boolean | null
  isPristine?: boolean
}

type TextFieldHandle = ComponentPublicInstance & { $el: HTMLElement }

function fieldConfig(
  field: AdvancedDateInputField,
  startFieldProps?: AdvancedDateInputFieldProps,
  endFieldProps?: AdvancedDateInputFieldProps,
) {
  return field === 'start' ? (startFieldProps ?? {}) : (endFieldProps ?? {})
}

export const VAdvancedDateRangeField = defineComponent({
  name: 'VAdvancedDateRangeField',

  props: {
    modelValue: {
      type: String,
      default: '',
    },
    label: String,
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
    color: String,
    density: {
      type: String as PropType<AdvancedDateDensity>,
      default: 'default',
    },
    disabled: Boolean,
    readonly: Boolean,
    suppressFocus: Boolean,
    startValue: {
      type: String,
      default: '',
    },
    endValue: {
      type: String,
      default: '',
    },
    startPlaceholder: {
      type: String,
      default: 'Start date',
    },
    endPlaceholder: {
      type: String,
      default: 'End date',
    },
    activeField: {
      type: String as PropType<AdvancedDateInputField>,
      default: 'start',
    },
    startFieldProps: Object as PropType<AdvancedDateInputFieldProps>,
    endFieldProps: Object as PropType<AdvancedDateInputFieldProps>,
    rootAttrs: {
      type: Object as PropType<Record<string, unknown>>,
      default: undefined,
    },
  },

  emits: {
    'update:startValue': (_value: string) => true,
    'update:endValue': (_value: string) => true,
    'update:activeField': (_value: AdvancedDateInputField) => true,
    focus: (_event: FocusEvent) => true,
    blur: (_event: FocusEvent) => true,
    'mousedown:control': (_payload: {
      event: MouseEvent
      field: AdvancedDateInputField
    }) => true,
    keydown: (_payload: {
      event: KeyboardEvent
      field: AdvancedDateInputField
    }) => true,
    'click:control': (_payload: {
      event: MouseEvent
      field: AdvancedDateInputField
    }) => true,
    'click:appendInner': (_payload: {
      event: MouseEvent
      field: AdvancedDateInputField
    }) => true,
    'click:clear': (_event: MouseEvent) => true,
  },

  setup(props, { emit, expose }) {
    const rootRef = ref<HTMLElement | null>(null)
    const inputRef = ref<RangeFieldHandle | null>(null)
    const startFieldRef = ref<TextFieldHandle | null>(null)
    const endFieldRef = ref<TextFieldHandle | null>(null)
    const groupFocused = ref(false)
    const suppressMouseSelection = ref<AdvancedDateInputField | null>(null)

    function resolveInput(field: AdvancedDateInputField) {
      const fieldRoot =
        (field === 'start'
          ? startFieldRef.value?.$el
          : endFieldRef.value?.$el) ?? null

      return fieldRoot?.querySelector('input') as HTMLInputElement | null
    }

    function resolveFieldProps(field: AdvancedDateInputField) {
      return fieldConfig(field, props.startFieldProps, props.endFieldProps)
    }

    function selectInput(input: HTMLInputElement) {
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => input.select())
        return
      }

      void nextTick(() => input.select())
    }

    function focusField(field: AdvancedDateInputField) {
      if (props.suppressFocus) return

      const input = resolveInput(field)
      if (!input) return

      input.focus()

      if (input.readOnly || input.disabled) return

      suppressMouseSelection.value = field
      selectInput(input)
    }

    function handleFieldFocus(
      field: AdvancedDateInputField,
      event: FocusEvent,
    ) {
      const wasFocused = groupFocused.value
      groupFocused.value = true
      emit('update:activeField', field)

      const input = resolveInput(field)
      if (input && !input.readOnly && !input.disabled) {
        suppressMouseSelection.value = field
        selectInput(input)
      }

      if (!wasFocused) {
        emit('focus', event)
      }
    }

    function handleFieldBlur(event: FocusEvent) {
      const nextTarget = event.relatedTarget
      if (nextTarget instanceof Node && rootRef.value?.contains(nextTarget)) {
        return
      }

      if (!groupFocused.value) return

      groupFocused.value = false
      emit('blur', event)
    }

    function handleMouseUp(field: AdvancedDateInputField, event: MouseEvent) {
      if (suppressMouseSelection.value !== field) return

      event.preventDefault()
      suppressMouseSelection.value = null
    }

    function renderSegment(
      field: AdvancedDateInputField,
      value: string,
      onUpdateValue: (value: string) => void,
      defaultPlaceholder: string,
      defaultPrependIcon?: AdvancedDateIconValue,
    ) {
      const config = resolveFieldProps(field)
      const inputReadonly = props.readonly || !!config.readonly
      const fieldClearable =
        props.clearable &&
        (field === 'start'
          ? !!props.startValue && !props.endValue
          : !!props.endValue)
      const prependIcon = config.prependInnerIcon ?? defaultPrependIcon
      const appendIcon = config.appendInnerIcon
      const attrs = config.attrs ?? {}
      const ariaLabel =
        config.ariaLabel ?? config.placeholder ?? defaultPlaceholder

      return (
        <VTextField
          ref={(instance) => {
            if (field === 'start') {
              startFieldRef.value = instance as TextFieldHandle | null
              return
            }

            endFieldRef.value = instance as TextFieldHandle | null
          }}
          {...(attrs as any)}
          class={[
            'flex-grow-1',
            'flex-shrink-1',
            'v-advanced-date-input__range-field',
            `v-advanced-date-input__range-field--${field}`,
            config.class,
          ]}
          style={config.style}
          modelValue={value}
          label={field === 'start' ? props.label : undefined}
          placeholder={config.placeholder ?? defaultPlaceholder}
          variant={props.variant as any}
          hideDetails
          density={props.density}
          disabled={props.disabled}
          readonly={inputReadonly}
          color={props.color}
          error={props.error}
          clearable={fieldClearable}
          autocomplete="off"
          id={config.id}
          name={config.name}
          aria-label={String(ariaLabel)}
          data-range-field={field}
          prependInnerIcon={prependIcon as any}
          appendInnerIcon={appendIcon as any}
          onUpdate:modelValue={(nextValue) =>
            onUpdateValue(String(nextValue ?? ''))
          }
          onFocus={(event: FocusEvent) => handleFieldFocus(field, event)}
          onBlur={handleFieldBlur}
          onMouseup={(event: MouseEvent) => handleMouseUp(field, event)}
          onKeydown={(event: KeyboardEvent) =>
            emit('keydown', { event, field })
          }
          onMousedown:control={(event: MouseEvent) =>
            emit('mousedown:control', { event, field })
          }
          onClick:control={(event: MouseEvent) => {
            focusField(field)
            emit('click:control', { event, field })
          }}
          onClick:appendInner={(event: MouseEvent) => {
            focusField(field)
            emit('click:appendInner', { event, field })
          }}
          onClick:clear={(event: MouseEvent) => emit('click:clear', event)}
        />
      )
    }

    expose({
      validate: (silent?: boolean) => inputRef.value?.validate?.(silent) ?? [],
      resetValidation: () =>
        inputRef.value?.resetValidation?.() ?? Promise.resolve(),
      get errorMessages() {
        return inputRef.value?.errorMessages ?? []
      },
      get isValid() {
        return inputRef.value?.isValid ?? null
      },
      get isPristine() {
        return inputRef.value?.isPristine ?? true
      },
      focusField: async (field: AdvancedDateInputField) => {
        await nextTick()
        focusField(field)
      },
    })

    return () => {
      const {
        class: rootClass,
        style: rootStyle,
        ...rootAttrs
      } = (props.rootAttrs ?? {}) as Record<string, unknown>

      return (
        <div
          {...(rootAttrs as any)}
          class={[
            rootClass,
            'v-advanced-date-input',
            'v-advanced-date-input--range',
          ]}
          style={rootStyle as any}
        >
          <VInput
            ref={(instance) => {
              inputRef.value = instance as RangeFieldHandle | null
            }}
            modelValue={props.modelValue}
            hideDetails={props.hideDetails}
            messages={props.messages}
            error={props.error}
            errorMessages={props.errorMessages}
            rules={props.rules as any}
            density={props.density}
            disabled={props.disabled}
            readonly={props.readonly}
            focused={groupFocused.value}
          >
            {{
              default: () => (
                <div
                  ref={rootRef}
                  class="d-flex flex-row w-100 v-advanced-date-input__range-fields"
                  onFocusout={handleFieldBlur}
                >
                  {renderSegment(
                    'start',
                    props.startValue,
                    (value) => emit('update:startValue', value),
                    props.startPlaceholder,
                    '$calendar',
                  )}

                  <VDivider
                    vertical
                    class="v-advanced-date-input__range-divider"
                  />

                  {renderSegment(
                    'end',
                    props.endValue,
                    (value) => emit('update:endValue', value),
                    props.endPlaceholder,
                  )}
                </div>
              ),
            }}
          </VInput>
        </div>
      )
    }
  },
})
