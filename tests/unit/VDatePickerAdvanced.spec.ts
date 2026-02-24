import { defineComponent, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import VDatePickerAdvanced from '../../src/components/VDatePickerAdvanced/VDatePickerAdvanced.vue'
import { fakeDateAdapter } from './helpers/fakeDateAdapter'

vi.mock('vuetify', () => ({
  useDate: () => fakeDateAdapter,
  useDisplay: () => ({ mobile: ref(false), name: ref('lg') }),
}))

const VDatePickerStub = defineComponent({
  name: 'VDatePicker',
  emits: ['update:model-value'],
  template:
    '<div class="date-picker-stub"><slot name="day" :item="{ date: new Date(), isoDate: \'2026-01-10\', localized: \'10\' }" :props="{}" :i="0" /></div>',
})

const VDateInputAdvancedPresetsStub = defineComponent({
  name: 'VDateInputAdvancedPresets',
  emits: ['select'],
  template: '<button class="preset-trigger" @click="$emit(\'select\', { label: \'Preset\', value: [new Date(\'2026-01-01\'), new Date(\'2026-01-03\')] })" />',
})

const SlotStub = defineComponent({
  template: '<div><slot /></div>',
})

describe('VDatePickerAdvanced', () => {
  it('emits update and apply when preset selected with autoApply', async () => {
    const wrapper = mount(VDatePickerAdvanced, {
      props: {
        modelValue: [],
        autoApply: true,
        presets: [
          {
            label: 'Preset',
            value: [new Date('2026-01-01'), new Date('2026-01-03')],
          },
        ],
      },
      global: {
        stubs: {
          VDatePicker: VDatePickerStub,
          VDateInputAdvancedPresets: VDateInputAdvancedPresetsStub,
          VDateInputAdvancedHeader: SlotStub,
          VBtn: SlotStub,
        },
      },
    })

    await wrapper.find('.preset-trigger').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('apply')).toBeTruthy()
  })

  it('emits range boundary events on picker updates', async () => {
    const wrapper = mount(VDatePickerAdvanced, {
      props: {
        modelValue: [],
        range: true,
        autoApply: false,
        presets: [],
      },
      global: {
        stubs: {
          VDatePicker: VDatePickerStub,
          VDateInputAdvancedPresets: VDateInputAdvancedPresetsStub,
          VDateInputAdvancedHeader: SlotStub,
          VBtn: SlotStub,
        },
      },
    })

    wrapper.findComponent(VDatePickerStub).vm.$emit('update:model-value', [
      new Date('2026-01-10'),
      new Date('2026-01-11'),
      new Date('2026-01-12'),
    ])

    expect(wrapper.emitted('range-start')).toBeTruthy()
    expect(wrapper.emitted('range-end')).toBeTruthy()
  })
})
