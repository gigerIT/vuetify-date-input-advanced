export interface PresetRange {
  label: string
  value: [unknown, unknown] | (() => [unknown, unknown])
  slot?: string
}

export interface ResolvedPresetRange {
  label: string
  value: [unknown, unknown]
  slot?: string
}
