export interface PresetRange {
  /** Display label for the preset */
  label: string
  /** Static tuple or factory function returning [start, end] */
  value: [Date, Date] | (() => [Date, Date])
  /** Optional named slot key for custom rendering */
  slot?: string
}
