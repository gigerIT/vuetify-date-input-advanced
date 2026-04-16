import { nextTick, readonly, ref, watch, type Ref } from 'vue'

import type { AdvancedDateAdapter, AdvancedDateModel } from '@/types'
import { normalizeModel } from '@/util/model'

interface OverlayPickerHandle {
  focusActiveDate?: () => void
}

function shouldCloseOnSelection<TDate>(
  adapter: AdvancedDateAdapter<TDate>,
  modelValue: AdvancedDateModel<TDate>,
  range: boolean,
): boolean {
  const selection = normalizeModel(adapter, modelValue, range)
  if (!range) return !!selection.start
  return !!selection.start && !!selection.end
}

export function useAdvancedDateOverlay<TDate>(options: {
  adapter: AdvancedDateAdapter<TDate>
  menu: Ref<boolean>
  inline: Ref<boolean>
  autoApply: Ref<boolean>
  range: Ref<boolean>
  pickerRef: Ref<OverlayPickerHandle | null>
  onMenuUpdate: (value: boolean) => void
  onModelUpdate: (value: AdvancedDateModel<TDate>) => void
  onApply: (value: AdvancedDateModel<TDate>) => void
  onCancel: () => void
}) {
  const menu = ref(options.menu.value)

  watch(options.menu, (value) => {
    menu.value = value
  })

  watch(menu, async (value) => {
    if (!value) return
    await nextTick()
    options.pickerRef.value?.focusActiveDate?.()
  })

  function setMenu(value: boolean) {
    menu.value = value
    options.onMenuUpdate(value)
  }

  function handlePickerUpdate(value: AdvancedDateModel<TDate>) {
    options.onModelUpdate(value)

    if (
      !options.inline.value &&
      options.autoApply.value &&
      shouldCloseOnSelection(options.adapter, value, options.range.value)
    ) {
      setMenu(false)
    }
  }

  function handleApply(value: AdvancedDateModel<TDate>) {
    options.onApply(value)
    setMenu(false)
  }

  function handleCancel() {
    options.onCancel()
    setMenu(false)
  }

  return {
    menu: readonly(menu),
    setMenu,
    handlePickerUpdate,
    handleApply,
    handleCancel,
  }
}
