import { defineComponent, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import VDateInputAdvanced from '../../src/components/VDateInputAdvanced/VDateInputAdvanced.vue'
import { fakeDateAdapter } from './helpers/fakeDateAdapter'

vi.mock('vuetify', () => ({
  useDate: () => fakeDateAdapter,
  useDisplay: () => ({ mobile: ref(false), name: ref('lg') }),
  useDefaults: <T>(props: T) => props,
}))

const VDatePickerAdvancedStub = defineComponent({
  name: 'VDatePickerAdvanced',
  emits: ['update:model-value', 'apply', 'cancel'],
  template: '<div class="picker-stub" />',
})

const VTextFieldStub = defineComponent({
  name: 'VTextField',
  emits: ['update:modelValue', 'blur', 'keydown', 'click:control', 'click:clear'],
  template: '<div class="text-field-stub"><slot /></div>',
})

const SlotStub = defineComponent({
  template: '<div><slot /></div>',
})

const stubs = {
  VDatePickerAdvanced: VDatePickerAdvancedStub,
  VTextField: VTextFieldStub,
  VMenu: SlotStub,
  VDialog: SlotStub,
  VCard: SlotStub,
  VSpacer: SlotStub,
  VBtn: SlotStub,
}

describe('VDateInputAdvanced', () => {
  it('buffers draft value when autoApply is false', async () => {
    const wrapper = mount(VDateInputAdvanced, {
      props: {
        inline: true,
        autoApply: false,
        modelValue: [],
      },
      global: { stubs },
    })

    const picker = wrapper.findComponent(VDatePickerAdvancedStub)
    picker.vm.$emit('update:model-value', [new Date('2026-01-10')])

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()

    picker.vm.$emit('apply')
    const events = wrapper.emitted('update:modelValue')
    expect(events).toBeTruthy()
    expect(Array.isArray(events?.[0]?.[0])).toBe(true)
  })

  it('emits immediately when autoApply is true', async () => {
    const wrapper = mount(VDateInputAdvanced, {
      props: {
        inline: true,
        autoApply: true,
        modelValue: [],
      },
      global: { stubs },
    })

    wrapper.findComponent(VDatePickerAdvancedStub).vm.$emit('update:model-value', [new Date('2026-02-01')])

    const events = wrapper.emitted('update:modelValue')
    expect(events).toBeTruthy()
    expect(events?.[0]?.[0]).toHaveLength(1)
  })

  it('parses input value on blur when configured', async () => {
    const wrapper = mount(VDateInputAdvanced, {
      props: {
        modelValue: null,
        range: false,
        updateOn: ['blur'],
        inputFormat: 'yyyy-mm-dd',
      },
      global: { stubs },
    })

    const textField = wrapper.findComponent(VTextFieldStub)
    textField.vm.$emit('update:modelValue', '2026-03-14')
    textField.vm.$emit('blur')

    const events = wrapper.emitted('update:modelValue')
    expect(events).toBeTruthy()
    expect(events?.[0]?.[0]).toBeInstanceOf(Date)
  })
})
