import type { PropType } from 'vue'
import { defineComponent, withDirectives } from 'vue'

import { Ripple } from 'vuetify/directives'

import type { AdvancedDateMonthData } from '@/types'

export const VAdvancedDateMonth = defineComponent({
  name: 'VAdvancedDateMonth',

  props: {
    month: {
      type: Object as PropType<AdvancedDateMonthData<unknown>>,
      required: true,
    },
    activeDateKey: {
      type: String,
      default: '',
    },
    showWeekNumbers: Boolean,
  },

  emits: {
    select: (_date: unknown) => true,
    hover: (_date: unknown | null) => true,
    focusDate: (_date: unknown) => true,
    keydown: (_event: KeyboardEvent, _date: unknown) => true,
  },

  setup(props, { emit, slots }) {
    return () => (
      <section
        class="v-advanced-date-picker__month"
        aria-labelledby={`month-${props.month.key}`}
      >
        <div class="v-advanced-date-picker__month-label">
          <span
            id={`month-${props.month.key}`}
            class="v-advanced-date-picker__month-label-text"
          >
            {props.month.label}
          </span>
        </div>

        <div class="v-advanced-date-picker__weekday-row" aria-hidden="true">
          {props.showWeekNumbers ? (
            <div class="v-advanced-date-picker__week-label">Wk</div>
          ) : null}
          {props.month.weekdays.map((weekday, index) => (
            <div
              key={`${props.month.key}-weekday-${index}`}
              class="v-advanced-date-picker__weekday"
            >
              {weekday}
            </div>
          ))}
        </div>

        <div
          class="v-advanced-date-picker__grid"
          role="grid"
          aria-labelledby={`month-${props.month.key}`}
        >
          {props.month.weeks.map((week) => (
            <div
              key={`${props.month.key}-week-${week.index}`}
              class="v-advanced-date-picker__week"
              role="row"
            >
              {props.showWeekNumbers ? (
                <div
                  class="v-advanced-date-picker__week-number"
                  role="rowheader"
                >
                  {week.weekNumber}
                </div>
              ) : null}

              {week.days.map((day) => {
                const dayProps = {
                  type: 'button' as const,
                  class: [
                    'v-advanced-date-picker__day',
                    {
                      'v-advanced-date-picker__day--outside': day.outside,
                      'v-advanced-date-picker__day--disabled': day.disabled,
                      'v-advanced-date-picker__day--today': day.today,
                      'v-advanced-date-picker__day--selected': day.selected,
                      'v-advanced-date-picker__day--range-start':
                        day.rangeStart,
                      'v-advanced-date-picker__day--range-end': day.rangeEnd,
                      'v-advanced-date-picker__day--in-range': day.inRange,
                      'v-advanced-date-picker__day--preview': day.preview,
                    },
                  ],
                  disabled: day.disabled,
                  tabindex: props.activeDateKey === day.key ? 0 : -1,
                  'data-date': day.key,
                  'aria-label': day.ariaLabel,
                  'aria-selected': day.selected || day.inRange,
                  'aria-disabled': day.disabled,
                  'aria-current': day.today ? ('date' as const) : undefined,
                  onClick: () => emit('select', day.date),
                  onFocus: () => emit('focusDate', day.date),
                  onMouseenter: () => emit('hover', day.date),
                  onKeydown: (event: KeyboardEvent) =>
                    emit('keydown', event, day.date),
                }

                return (
                  <div
                    key={day.key}
                    class={[
                      'v-advanced-date-picker__day-cell',
                      {
                        'v-advanced-date-picker__day-cell--outside':
                          day.outside,
                        'v-advanced-date-picker__day-cell--selected':
                          day.selected,
                        'v-advanced-date-picker__day-cell--range-start':
                          day.rangeStart,
                        'v-advanced-date-picker__day-cell--range-end':
                          day.rangeEnd,
                        'v-advanced-date-picker__day-cell--in-range':
                          day.inRange,
                        'v-advanced-date-picker__day-cell--preview':
                          day.preview,
                      },
                    ]}
                    role="gridcell"
                  >
                    {day.outside ? (
                      <div
                        class="v-advanced-date-picker__day-placeholder"
                        aria-hidden="true"
                      />
                    ) : null}
                    {day.outside
                      ? null
                      : (slots.day?.({
                          date: day.date,
                          outside: day.outside,
                          disabled: day.disabled,
                          today: day.today,
                          selected: day.selected,
                          rangeStart: day.rangeStart,
                          rangeEnd: day.rangeEnd,
                          inRange: day.inRange,
                          preview: day.preview,
                          props: dayProps,
                        }) ??
                        withDirectives(
                          <button {...dayProps}>{day.label}</button>,
                          [[Ripple, !day.disabled]],
                        ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </section>
    )
  },
})
