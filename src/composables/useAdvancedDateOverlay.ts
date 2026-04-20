import { nextTick, readonly, ref, watch, type Ref } from 'vue'

interface OverlayPickerHandle {
  focusActiveDate?: () => void
}

export function useAdvancedDateOverlay(options: {
  menu: Ref<boolean>
  pickerRef: Ref<OverlayPickerHandle | null>
  onMenuUpdate: (value: boolean) => void
  onExternalCloseRequest?: (() => boolean | Promise<boolean>) | undefined
}) {
  const menu = ref(options.menu.value)
  let menuSyncRequestId = 0

  watch(options.menu, async (value) => {
    const requestId = ++menuSyncRequestId

    if (value) {
      menu.value = true
      return
    }

    if (!menu.value) {
      menu.value = false
      return
    }

    if (!options.onExternalCloseRequest) {
      menu.value = false
      return
    }

    const shouldClose = await options.onExternalCloseRequest()
    if (requestId !== menuSyncRequestId) return

    if (shouldClose) {
      menu.value = false
      return
    }

    menu.value = true
    if (!options.menu.value) {
      options.onMenuUpdate(true)
    }
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

  function openMenu() {
    setMenu(true)
  }

  function closeMenu() {
    setMenu(false)
  }

  return {
    menu: readonly(menu),
    setMenu,
    openMenu,
    closeMenu,
  }
}
