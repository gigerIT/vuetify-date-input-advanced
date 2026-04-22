<script setup lang="ts">
import { usePlaygroundAdvancedState } from '../composables/usePlaygroundAdvancedState'
import { allowOnly, createLocalDate } from '../playgroundDateUtils'

const {
  allowFridays,
  allowMondays,
  closeStrategyOptions,
  constrainedDraftRangeValue,
  constrainedGapMonthValue,
  constrainedHardBoundsValue,
  constrainedMobileFullscreenValue,
  constrainedRevealedMonthValue,
  constrainedValue,
  customPresetMenu,
  customPresets,
  disableWeekends,
  draftApiCloseStrategy,
  draftApiMenu,
  draftApiOutput,
  draftApiRef,
  draftApiText,
  draftApiValue,
  flightEndFieldProps,
  flightStartFieldProps,
  formValidationIsValid,
  formValidationOutput,
  formValidationPaymentDate,
  formValidationPaymentMenu,
  formValidationPaymentText,
  formValidationStartFieldProps,
  formValidationEndFieldProps,
  formValidationSubmitCount,
  formValidationTravelDates,
  formValidationTravelMenu,
  formValidationTravelText,
  formValidationVisibleErrors,
  handleDraftClose,
  handleDraftCommit,
  handleDraftInvalid,
  handleDraftUpdate,
  handleFormValidationBlur,
  maxDate,
  minDate,
  pasteEndFieldProps,
  pasteStartFieldProps,
  pickerOnlyValue,
  rangeValue,
  resetFormValidationExample,
  runDraftCommit,
  runDraftRevert,
  runDraftValidate,
  singleValue,
  submitFormValidationExample,
  touchFormValidationField,
  typedValue,
} = usePlaygroundAdvancedState()
</script>

<template>
  <div class="advanced-tab" data-testid="playground-tab-advanced">
    <v-sheet border rounded="xl" class="pa-6">
      <div class="text-overline text-primary">Advanced QA</div>
      <h2 class="text-h5 font-weight-bold mb-2">Custom behaviors and regression traps</h2>
      <p class="text-body-1 text-medium-emphasis mb-0">
        This tab keeps the deeper examples together: customization surfaces,
        external validation flows, draft handling, and the edge cases that have
        caused regressions before.
      </p>
    </v-sheet>

    <section class="advanced-section">
      <div class="advanced-section__header">
        <div class="text-overline">Customizations</div>
        <h3 class="text-h6 font-weight-bold mb-1">Consumer-facing variations</h3>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Focus on prop overrides, field wiring, and consumer-provided slots.
        </p>
      </div>

      <div class="advanced-grid">
        <v-card variant="flat">
          <v-card-title>Range input with custom navigation icons</v-card-title>
          <v-card-subtitle>
            Demonstrates explicit picker icon overrides on the shared input surface.
          </v-card-subtitle>
          <v-card-text>
            <v-advanced-date-input
              v-model="rangeValue"
              label="Travel dates"
              :months="2"
              :show-presets="false"
              prev-icon="mdi-page-first"
              next-icon="mdi-page-last"
              append-inner-icon="mdi-calendar-range"
            />
          </v-card-text>
        </v-card>

        <v-card variant="flat">
          <v-card-title>Range input with custom presets</v-card-title>
          <v-card-subtitle>
            Exercises custom preset data and slot rendering.
          </v-card-subtitle>
          <v-card-text>
            <v-advanced-date-input
              v-model="rangeValue"
              v-model:menu="customPresetMenu"
              label="Travel dates"
              :months="2"
              show-presets
              :presets="customPresets"
            >
              <template #preset-highlight="{ preset }">
                <div class="d-flex align-center justify-space-between w-100">
                  <span>{{ preset.label }}</span>
                  <v-chip size="x-small" color="primary" variant="tonal">
                    Custom
                  </v-chip>
                </div>
              </template>
            </v-advanced-date-input>
          </v-card-text>
        </v-card>

        <v-card variant="flat">
          <v-card-title>Input color prop</v-card-title>
          <v-card-subtitle>
            Focus the fields to inspect field-only color behavior.
          </v-card-subtitle>
          <v-card-text class="d-flex flex-column ga-4">
            <v-advanced-date-input
              v-model="singleValue"
              color="success"
              label="Utility color"
              :range="false"
              :show-presets="false"
            />

            <v-advanced-date-input
              v-model="rangeValue"
              color="rgba(0, 128, 128, 0.85)"
              label="CSS color"
              :show-presets="false"
            />
          </v-card-text>
        </v-card>

        <v-card variant="flat">
          <v-card-title>Forwarded input attrs</v-card-title>
          <v-card-subtitle>
            Shows form attrs reaching the default text input.
          </v-card-subtitle>
          <v-card-text>
            <v-advanced-date-input
              id="playground-check-in-date"
              v-model="singleValue"
              name="checkInDate"
              label="Check-in date"
              data-testid="playground-check-in-date"
              :range="false"
              :show-presets="false"
            />
            <div class="text-caption text-medium-emphasis mt-2">
              Inspect the rendered input to verify forwarded attrs such as
              <code>id</code>, <code>name</code>, and <code>data-testid</code>.
            </div>
          </v-card-text>
        </v-card>

        <v-card variant="flat">
          <v-card-title>Custom picker title</v-card-title>
          <v-card-subtitle>
            Shows an optional heading that stays visible in both overlay modes.
          </v-card-subtitle>
          <v-card-text>
            <v-advanced-date-input
              v-model="singleValue"
              label="Departure date"
              title="Departure Date"
              :range="false"
              :months="2"
              :show-presets="false"
            />
          </v-card-text>
        </v-card>

        <v-card variant="flat">
          <v-card-title>Range picker titles</v-card-title>
          <v-card-subtitle>
            Switches between start and end titles while the user completes a range.
          </v-card-subtitle>
          <v-card-text>
            <v-advanced-date-input
              v-model="rangeValue"
              label="Travel dates"
              title="Travel dates"
              title-start-date="Departure date"
              title-end-date="Return date"
              :months="2"
              :show-presets="false"
            />
          </v-card-text>
        </v-card>

        <v-card variant="flat">
          <v-card-title>Split range inputs</v-card-title>
          <v-card-subtitle>
            Uses separate start/end field props for placeholders and form attrs.
          </v-card-subtitle>
          <v-card-text>
            <v-advanced-date-input
              v-model="rangeValue"
              label="Flight dates"
              title="Flight dates"
              title-start-date="Depart"
              title-end-date="Return"
              :months="2"
              :start-field-props="flightStartFieldProps"
              :end-field-props="flightEndFieldProps"
              :show-presets="false"
            />
          </v-card-text>
        </v-card>
      </div>
    </section>

    <section class="advanced-section">
      <div class="advanced-section__header">
        <div class="text-overline">Validation And Drafts</div>
        <h3 class="text-h6 font-weight-bold mb-1">Parent-controlled flows</h3>
        <p class="text-body-2 text-medium-emphasis mb-0">
          These examples exercise typed input, public instance methods, and
          external validation.
        </p>
      </div>

      <div class="advanced-grid">
        <v-card variant="flat">
          <v-card-title>Typed input + validation</v-card-title>
          <v-card-subtitle>
            Test paste and keyboard entry before applying the value.
          </v-card-subtitle>
          <v-card-text>
            <v-advanced-date-input
              v-model="typedValue"
              label="Paste a range"
              :months="2"
              :auto-apply="false"
              :start-field-props="pasteStartFieldProps"
              :end-field-props="pasteEndFieldProps"
            />
          </v-card-text>
        </v-card>

        <v-card variant="flat">
          <v-card-title>Picker-only input</v-card-title>
          <v-card-subtitle>
            Keeps the field interactive while disabling manual typing.
          </v-card-subtitle>
          <v-card-text>
            <v-advanced-date-input
              v-model="pickerOnlyValue"
              label="Choose with picker only"
              input-readonly
              clearable
              :range="false"
              :months="2"
              :auto-apply="false"
              :show-presets="false"
            />
          </v-card-text>
        </v-card>

        <v-card
          variant="flat"
          class="advanced-grid__wide"
          data-testid="playground-form-validation"
        >
          <v-card-title>Form validation with error props</v-card-title>
          <v-card-subtitle>
            Mirrors a parent form that validates on blur or submit.
          </v-card-subtitle>
          <v-card-text class="d-flex flex-column ga-4">
            <v-form
              class="d-flex flex-column ga-4"
              data-testid="playground-form-validation-form"
              @submit.prevent="submitFormValidationExample"
            >
              <v-advanced-date-input
                v-model="formValidationPaymentDate"
                v-model:menu="formValidationPaymentMenu"
                v-model:text="formValidationPaymentText"
                label="Payment date"
                name="paymentDate"
                :range="false"
                :show-presets="false"
                :error="formValidationVisibleErrors.paymentDate.length > 0"
                :error-messages="formValidationVisibleErrors.paymentDate"
                @blur="handleFormValidationBlur('paymentDate')"
                @draft-close="touchFormValidationField('paymentDate')"
              />

              <v-advanced-date-input
                v-model="formValidationTravelDates"
                v-model:menu="formValidationTravelMenu"
                v-model:text="formValidationTravelText"
                label="Travel dates"
                title="Travel dates"
                title-start-date="Departure"
                title-end-date="Return"
                :months="2"
                :show-presets="false"
                :start-field-props="formValidationStartFieldProps"
                :end-field-props="formValidationEndFieldProps"
                :error="formValidationVisibleErrors.travelDates.length > 0"
                :error-messages="formValidationVisibleErrors.travelDates"
                @blur="handleFormValidationBlur('travelDates')"
                @draft-close="touchFormValidationField('travelDates')"
              />

              <div class="d-flex flex-wrap ga-3">
                <v-btn
                  color="primary"
                  type="submit"
                  data-testid="playground-form-validation-submit"
                >
                  Validate booking form
                </v-btn>
                <v-btn variant="text" @click="resetFormValidationExample">
                  Reset
                </v-btn>
              </div>
            </v-form>

            <v-alert
              v-if="formValidationSubmitCount && !formValidationIsValid"
              type="warning"
              variant="tonal"
            >
              Fix the highlighted date fields before submitting the form.
            </v-alert>

            <v-alert
              v-else-if="formValidationOutput.lastSubmission"
              type="success"
              variant="tonal"
            >
              Form payload is valid and ready to submit.
            </v-alert>

            <div class="text-caption text-medium-emphasis">
              This example keeps validation in the parent and forwards the resulting
              <code>error</code> and <code>error-messages</code> props, which is the
              same pattern a schema-driven form would use.
            </div>

            <v-sheet border rounded="lg" class="pa-4">
              <pre class="form-validation-output text-body-2">{{
                JSON.stringify(formValidationOutput, null, 2)
              }}</pre>
            </v-sheet>
          </v-card-text>
        </v-card>

        <v-card variant="flat" class="advanced-grid__wide">
          <v-card-title>Draft API + external submit</v-card-title>
          <v-card-subtitle>
            Binds <code>v-model:text</code>, surfaces <code>update:draft</code>, and
            uses the public handle to validate or commit from a parent.
          </v-card-subtitle>
          <v-card-text class="d-flex flex-column ga-4">
            <div class="d-flex flex-wrap align-center ga-3">
              <v-select
                v-model="draftApiCloseStrategy"
                label="Close strategy"
                :items="closeStrategyOptions"
                density="comfortable"
                hide-details
                style="min-width: 220px; max-width: 320px"
              />

              <v-btn color="primary" @click="runDraftCommit">Parent submit</v-btn>
              <v-btn variant="tonal" @click="runDraftValidate">Validate draft</v-btn>
              <v-btn variant="text" @click="runDraftRevert">Revert draft</v-btn>
            </div>

            <v-advanced-date-input
              ref="draftApiRef"
              v-model="draftApiValue"
              v-model:text="draftApiText"
              v-model:menu="draftApiMenu"
              label="Travel dates with draft API"
              :months="2"
              :close-draft-strategy="draftApiCloseStrategy"
              @update:draft="handleDraftUpdate"
              @input-commit="handleDraftCommit"
              @input-invalid="handleDraftInvalid"
              @draft-close="handleDraftClose"
            />

            <div class="text-caption text-medium-emphasis">
              Try one range click, then dismiss the overlay or press Escape after
              switching strategies. The preview distinguishes committed model state
              from pending partial draft state.
            </div>

            <v-sheet border rounded="lg" class="pa-4">
              <pre class="draft-api-output text-body-2">{{
                JSON.stringify(draftApiOutput, null, 2)
              }}</pre>
            </v-sheet>
          </v-card-text>
        </v-card>
      </div>
    </section>

    <section class="advanced-section">
      <div class="advanced-section__header">
        <div class="text-overline">Constraints And Regressions</div>
        <h3 class="text-h6 font-weight-bold mb-1">Availability edge cases</h3>
        <p class="text-body-2 text-medium-emphasis mb-0">
          These are the demos that have historically caught navigation and
          constrained-selection bugs.
        </p>
      </div>

      <div class="advanced-grid">
        <v-card variant="flat">
          <v-card-title>Constrained selection</v-card-title>
          <v-card-subtitle>
            Limits dates to weekdays, with Monday-only starts and Friday-only ends.
          </v-card-subtitle>
          <v-card-text>
            <v-advanced-date-input
              v-model="constrainedValue"
              label="Start Monday, end Friday"
              :months="2"
              :min="minDate"
              :max="maxDate"
              :allowed-dates="disableWeekends"
              :allowed-start-dates="allowMondays"
              :allowed-end-dates="allowFridays"
            />
          </v-card-text>
        </v-card>

        <v-card variant="flat" class="advanced-grid__wide">
          <v-card-title>Constrained navigation edge cases</v-card-title>
          <v-card-subtitle>
            Inline pickers that show when month arrows disable instead of no-oping.
          </v-card-subtitle>
          <v-card-text class="d-flex flex-column ga-4">
            <v-sheet
              border
              rounded="lg"
              class="pa-4"
              data-testid="playground-edge-hard-bounds"
            >
              <div class="text-subtitle-2 font-weight-medium">Hard min/max bounds</div>
              <div class="text-caption text-medium-emphasis mb-4">
                A two-month viewport locked to January and February 2026.
              </div>
              <v-advanced-date-picker
                v-model="constrainedHardBoundsValue"
                :range="false"
                :months="2"
                :show-presets="false"
                :month="0"
                :year="2026"
                :min="createLocalDate(2026, 0, 10)"
                :max="createLocalDate(2026, 1, 10)"
              />
            </v-sheet>

            <v-sheet
              border
              rounded="lg"
              class="pa-4"
              data-testid="playground-edge-revealed-month"
            >
              <div class="text-subtitle-2 font-weight-medium">
                Revealed month has no selectable dates
              </div>
              <div class="text-caption text-medium-emphasis mb-4">
                February 2026 still has one valid date and January stays reachable.
              </div>
              <v-advanced-date-picker
                v-model="constrainedRevealedMonthValue"
                :range="false"
                :months="1"
                :show-presets="false"
                :month="1"
                :year="2026"
                :allowed-dates="allowOnly('2026-01-15', '2026-02-05')"
              />
            </v-sheet>

            <v-sheet
              border
              rounded="lg"
              class="pa-4"
              data-testid="playground-edge-draft-range"
            >
              <div class="text-subtitle-2 font-weight-medium">
                Pending range end locks future navigation
              </div>
              <div class="text-caption text-medium-emphasis mb-4">
                This starts from the intermediate one-click range state.
              </div>
              <v-advanced-date-picker
                v-model="constrainedDraftRangeValue"
                :months="1"
                :show-presets="false"
                :auto-apply="false"
                :month="0"
                :year="2026"
                :allowed-start-dates="allowOnly('2026-01-20', '2026-02-10')"
                :allowed-end-dates="allowOnly('2026-01-25')"
              />
            </v-sheet>

            <v-sheet
              border
              rounded="lg"
              class="pa-4"
              data-testid="playground-edge-gap-month"
            >
              <div class="text-subtitle-2 font-weight-medium">Gap months are not skipped</div>
              <div class="text-caption text-medium-emphasis mb-4">
                April has a selectable date, but March is empty.
              </div>
              <v-advanced-date-picker
                v-model="constrainedGapMonthValue"
                :range="false"
                :months="1"
                :show-presets="false"
                :month="1"
                :year="2026"
                :allowed-dates="allowOnly('2026-02-10', '2026-04-10')"
              />
            </v-sheet>

            <v-sheet
              border
              rounded="lg"
              class="pa-4"
              data-testid="playground-edge-mobile-fullscreen"
            >
              <div class="text-subtitle-2 font-weight-medium">
                Mobile fullscreen constrained scroll limit
              </div>
              <div class="text-caption text-medium-emphasis mb-4">
                Resize below the mobile breakpoint to activate fullscreen scrolling.
              </div>
              <v-advanced-date-picker
                v-model="constrainedMobileFullscreenValue"
                mobile-presentation="fullscreen"
                :range="false"
                :months="2"
                :show-presets="false"
                :month="0"
                :year="2026"
                :min="createLocalDate(2026, 0, 10)"
                :max="createLocalDate(2026, 1, 10)"
              />
            </v-sheet>
          </v-card-text>
        </v-card>
      </div>
    </section>
  </div>
</template>

<style scoped>
.advanced-tab {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.advanced-section {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.advanced-section__header .text-overline {
  color: rgba(var(--v-theme-primary), 0.9);
  letter-spacing: 0.12em;
}

.advanced-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.advanced-grid__wide {
  grid-column: 1 / -1;
}

.draft-api-output {
  margin: 0;
  max-height: 320px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.form-validation-output {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
