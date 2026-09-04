<template>
  <q-dialog
    ref="dialogRef"
    maximized
    transition-show="jump-up"
    transition-hide="jump-down"
    :transition-duration="320"
    @hide="onDialogHide"
  >
    <q-card class="sw-modal">
      <header class="sw-modal__bar">
        <div class="sw-modal__bar-inner">
          <button type="button" class="sw-modal__back" aria-label="Volver" v-close-popup>
            <q-icon name="sym_o_chevron_left" size="22px" />
          </button>
          <h2 class="sw-modal__title">
            {{ isEdit ? 'Editar alumno' : 'Nuevo alumno' }}
          </h2>
        </div>
      </header>

      <q-form class="sw-modal__form" @submit.prevent="save">
        <div class="sw-modal__scroll">
          <div class="sw-modal__inner">
            <!-- Datos del alumno -->
            <section class="sw-card student-form__card">
              <span class="sw-overline">Datos del alumno</span>

              <div class="student-form__grid">
              <div class="sw-field student-form__span-2">
                <label class="sw-overline sw-overline--plain sw-field__label" for="student-name">
                  Nombre completo
                </label>
                <q-input
                  for="student-name"
                  v-model="form.name"
                  borderless
                  placeholder="Ej: Yesicca Rojas"
                  autocomplete="name"
                  :rules="[(v) => !!v?.trim() || 'Escribe el nombre']"
                  hide-bottom-space
                />
              </div>

              <div class="sw-field">
                <label class="sw-overline sw-overline--plain sw-field__label" for="student-document">
                  Documento
                </label>
                <q-input
                  for="student-document"
                  v-model="form.document"
                  borderless
                  inputmode="numeric"
                  placeholder="Ej: 1023456789"
                  hide-bottom-space
                />
              </div>

              <div class="sw-field">
                <label class="sw-overline sw-overline--plain sw-field__label" for="student-age">
                  Edad
                </label>
                <q-input
                  for="student-age"
                  v-model.number="ageInput"
                  borderless
                  type="number"
                  inputmode="numeric"
                  placeholder="Ej: 9"
                  :rules="[
                    (v) =>
                      v === '' ||
                      v === null ||
                      (typeof v === 'number' && v >= 0 && v <= 120) ||
                      'Edad inválida',
                  ]"
                  hide-bottom-space
                />
              </div>

              <div class="sw-field student-form__span-2">
                <label class="sw-overline sw-overline--plain sw-field__label" for="student-phone">
                  Teléfono WhatsApp
                </label>
                <q-input
                  for="student-phone"
                  v-model="form.phone"
                  borderless
                  type="tel"
                  inputmode="tel"
                  placeholder="3025916027"
                  autocomplete="tel"
                  hide-bottom-space
                />
              </div>
              </div>
            </section>

            <!-- Mensualidad -->
            <section class="sw-card student-form__card">
              <span class="sw-overline">Mensualidad</span>

              <div class="student-form__grid">
              <div class="student-form__span-2">
                <date-field
                  v-model="form.startDate"
                  label="Fecha de inicio"
                  field-id="student-start"
                  required-message="Elige la fecha"
                />
                <div class="student-form__hint">
                  La mensualidad siempre vence este día del mes.
                </div>
              </div>

              <money-field
                v-model="form.monthlyFee"
                label="Mensualidad"
                field-id="student-fee"
                placeholder="170.000"
              />

              <money-field v-model="form.poolFee" label="Piscina" field-id="student-pool" />

              <!-- Al editar, el vencimiento se puede corregir a mano. -->
              <div v-if="isEdit" class="student-form__span-2">
                <date-field
                  v-model="paidThrough"
                  label="Pagado hasta"
                  field-id="student-paid-through"
                  required-message="Elige la fecha"
                />
                <div class="student-form__hint">{{ paidThroughHint }}</div>
              </div>

              <div v-if="!isEdit" class="student-form__span-2">
                <span class="sw-overline sw-overline--plain sw-field__label">
                  Estado de la mensualidad
                </span>
                <div
                  class="student-form__chips"
                  role="radiogroup"
                  aria-label="Estado de la mensualidad"
                >
                  <button
                    type="button"
                    class="student-form__chip"
                    :class="{ 'student-form__chip--active': form.paid }"
                    role="radio"
                    :aria-checked="form.paid"
                    @click="form.paid = true"
                  >
                    <q-icon name="sym_o_check" size="16px" />
                    Ya pagó
                  </button>
                  <button
                    type="button"
                    class="student-form__chip"
                    :class="{ 'student-form__chip--active': !form.paid }"
                    role="radio"
                    :aria-checked="!form.paid"
                    @click="form.paid = false"
                  >
                    <q-icon name="sym_o_schedule" size="16px" />
                    Debe
                  </button>
                </div>
                <div class="student-form__hint">
                  {{
                    form.paid
                      ? `Queda al día hasta el ${coverageLabel}.`
                      : 'La mensualidad vence desde la fecha de inicio.'
                  }}
                </div>
              </div>
              </div>
            </section>
          </div>
        </div>

        <footer class="sw-modal__footer">
          <div class="sw-modal__footer-inner">
            <q-btn
              unelevated
              no-caps
              type="submit"
              color="primary"
              class="sw-btn full-width"
              :label="isEdit ? 'Guardar cambios' : 'Crear alumno'"
              :loading="saving"
            />
          </div>
        </footer>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useDialogPluginComponent, useQuasar } from 'quasar';
import DateField from 'src/components/DateField.vue';
import MoneyField from 'src/components/MoneyField.vue';
import { StudentDoc, StudentInput } from 'src/models/Student';
import { useStudentsStore } from 'src/stores/students-store';
import { useSettingsStore } from 'src/stores/settings-store';
import { addMonthsIso, formatShortDate, todayIso } from 'src/utils/dates';
import { dueLabel, getStatus, STATUS_LABEL } from 'src/utils/subscription';

// Se abre con $q.dialog({ component: StudentFormDialog, componentProps }):
// el componente se monta fresco en cada apertura, así el estado nace del
// alumno recibido (o vacío para uno nuevo) sin watchers de reseteo.
const props = defineProps<{ student?: StudentDoc | null }>();

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

const $q = useQuasar();
const studentsStore = useStudentsStore();
const settingsStore = useSettingsStore();

const isEdit = computed(() => !!props.student);

const form = reactive<Omit<StudentInput, 'age'>>({
  name: props.student?.name ?? '',
  phone: props.student?.phone ?? '',
  document: props.student?.document ?? '',
  startDate: props.student?.startDate ?? todayIso(),
  // Los valores por defecto vienen de Configuración.
  monthlyFee: props.student?.monthlyFee ?? settingsStore.monthlyFee,
  poolFee: props.student?.poolFee ?? settingsStore.poolFee,
  paid: true,
});
// La edad es opcional: '' en el input equivale a null en el modelo.
const ageInput = ref<number | ''>(props.student?.age ?? '');
const paidThrough = ref(props.student?.paidThrough ?? '');
const saving = ref(false);

const ageValue = computed(() =>
  typeof ageInput.value === 'number' ? ageInput.value : null
);

const coverageLabel = computed(() =>
  form.startDate ? formatShortDate(addMonthsIso(form.startDate, 1), true) : ''
);

const paidThroughHint = computed(() => {
  if (!paidThrough.value) return '';
  const status = getStatus(paidThrough.value);
  return `Con esta fecha queda: ${STATUS_LABEL[status]} · ${dueLabel(paidThrough.value).toLowerCase()}.`;
});

const save = async () => {
  saving.value = true;
  try {
    if (props.student) {
      await studentsStore.updateStudent(props.student._id, {
        name: form.name,
        phone: form.phone,
        document: form.document,
        age: ageValue.value,
        startDate: form.startDate,
        monthlyFee: form.monthlyFee,
        poolFee: form.poolFee,
        paidThrough: paidThrough.value,
      });
      $q.notify({ message: 'Cambios guardados', color: 'positive' });
    } else {
      await studentsStore.addStudent({ ...form, age: ageValue.value });
      $q.notify({ message: `${form.name.trim()} agregado`, color: 'positive' });
    }
    onDialogOK();
  } catch (error) {
    console.error(error);
    $q.notify({
      message: 'No se pudo guardar. Revisa la conexión e inténtalo de nuevo.',
      color: 'negative',
    });
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped lang="scss">
// Cada sección vive en su cajita con borde.
.student-form__card {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.student-form__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

@media (min-width: 480px) {
  .student-form__grid {
    grid-template-columns: 1fr 1fr;
  }

  .student-form__span-2 {
    grid-column: span 2;
  }
}

.student-form__chips {
  display: flex;
  gap: 8px;
}

.student-form__chip {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 44px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--sw-border);
  background: var(--sw-bg);
  color: var(--sw-text);
  font: inherit;
  font-size: 0.8438rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 120ms var(--sw-ease), border-color 120ms var(--sw-ease);

  &:focus-visible {
    outline: 2px solid var(--sw-primary);
    outline-offset: 2px;
  }

  &--active {
    background: var(--sw-primary-tint);
    border-color: var(--sw-primary-border);
    color: #0e5c8a;
  }
}

.student-form__hint {
  margin-top: 8px;
  font-size: 0.8125rem;
  color: var(--sw-text-2);
}
</style>
