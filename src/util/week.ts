import type { AdvancedDateAdapter } from '@/types'

function toLocalMidday(iso: string): Date {
  const [datePart] = iso.split('T')
  return new Date(`${datePart}T12:00:00`)
}

export function getIsoWeekNumber<TDate>(adapter: AdvancedDateAdapter<TDate>, date: TDate): number {
  const jsDate = toLocalMidday(adapter.toISO(date))
  const weekday = (jsDate.getDay() + 6) % 7
  jsDate.setDate(jsDate.getDate() + 3 - weekday)

  const firstThursday = new Date(jsDate.getFullYear(), 0, 4)
  const firstWeekday = (firstThursday.getDay() + 6) % 7
  firstThursday.setDate(firstThursday.getDate() + 3 - firstWeekday)

  const diff = jsDate.getTime() - firstThursday.getTime()

  return 1 + Math.round(diff / 604800000)
}

export function getWeekdayIndex<TDate>(adapter: AdvancedDateAdapter<TDate>, date: TDate): number {
  return toLocalMidday(adapter.toISO(date)).getDay()
}
