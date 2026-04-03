import type { ComputedRef, InjectionKey } from 'vue'

export type AdvancedDateMobilePresentation = 'fullscreen' | 'inline'

export const advancedDateMobilePresentationKey: InjectionKey<
  ComputedRef<AdvancedDateMobilePresentation | null>
> = Symbol('advanced-date-mobile-presentation')
