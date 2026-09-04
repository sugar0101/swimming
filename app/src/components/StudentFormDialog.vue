<template>
  <q-dialog
    ref="dialogRef"
    maximized
    transition-show="jump-up"
    transition-hide="jump-down"
    :transition-duration="320"
    @hide="onDialogHide"
  >
    <q-card class="student-form">
      <!-- Barra superior fija: cerrar + título. -->
      <header class="student-form__bar">
        <div class="student-form__bar-inner">
          <q-btn flat round dense icon="sym_o_close" aria-label="Cerrar" v-close-popup />
          <h2 class="student-form__title sw-heading">
            {{ isEdit ? 'Editar alumno' : 'Nuevo alumno' }}
          </h2>
        </div>
      </header>

      <q-form class="student-form__form" @submit.prevent="submit">
        <div class="student-form__scroll">
          <div class="student-form__inner">
            <section class="student-form__section">
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
                    Documento de identidad
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

                <div>
                  <date-field
                    v-model="form.birthDate"
                    label="Fecha de nacimiento"
                    field-id="student-birth"
                    placeholder="Elegir fecha"
                    :max="today"
                    clearable
                  />
                  <div v-if="ageLabel" class="student-form__hint">{{ ageLabel }}</div>
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

            <section class="student-form__section">
              <span class="sw-overline">Mensualidad</span>

              <div class="student-form__grid">
                <div>
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

                <div class="sw-field">
                  <label class="sw-overline sw-overline--plain sw-field__label" for="student-fee">
                    Valor mensualidad
                  </label>
                  <q-input
                    for="student-fee"
                    v-model.number="form.monthlyFee"
                    borderless
                    type="number"
                    inputmode="numeric"
                    prefix="$"
                    placeholder="170000"
                    :rules="[(v) => (typeof v === 'number' && v >= 0) || 'Escribe el valor']"
                    hide-bottom-space
                  />
                </div>

                <div class="sw-field student-form__span-2">
                  <label class="sw-overline sw-overline--plain sw-field__label" for="student-pool">
                    Valor piscina
                  </label>
                  <q-input
                    for="student-pool"
                    v-model.number="form.poolFee"
                    borderless
                    type="number"
                    inputmode="numeric"
                    prefix="$"
                    placeholder="0"
                    :rules="[(v) => (typeof v === 'number' && v >= 0) || 'Escribe el valor']"
                    hide-bottom-space
                  />
                  <div class="student-form__hint">
                    Lo que se paga a la piscina por este alumno cada mes. Se descuenta
                    del neto en la caja.
                  </div>
                </div>

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
              </div>

              <div v-if="!isEdit" class="student-form__status">
                <span class="sw-overline sw-overline--plain sw-field__label">
                  Estado de la mensualidad
                </span>
                <div class="student-form__chips" role="radiogroup" aria-label="Estado de la mensualidad">
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
            </section>
          </div>
        </div>

        <!-- Botón fijo abajo, siempre a la vista. -->
        <footer class="student-form__footer">
          <div class="student-form__inner">
            <q-btn
              unelevated
              no-caps
              type="submit"
              color="primary"
              class="sw-btn full-width"
              :label="isEdit ? 'Guardar cambios' : 'Agregar alumno'"
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
import { StudentDoc, StudentInput } from 'src/models/Student';
import { useStudentsStore } from 'src/stores/students-store';
import { addMonthsIso, ageFrom, formatShortDate, todayIso } from 'src/utils/dates';
import { dueLabel, getStatus, STATUS_LABEL } from 'src/utils/subscription';

// Se abre con $q.dialog({ component: StudentFormDialog, componentProps }):
// el componente se monta fresco en cada apertura, así el estado nace del
// alumno recibido (o vacío para uno nuevo) sin watchers de reseteo.
const props = defineProps<{ student?: StudentDoc | null }>();

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

const $q = useQuasar();
const studentsStore = useStudentsStore();

const isEdit = computed(() => !!props.student);
const today = todayIso();

const form = reactive<StudentInput>({
  name: props.student?.name ?? '',
  phone: props.student?.phone ?? '',
  document: props.student?.document ?? '',
  birthDate: props.student?.birthDate ?? '',
  startDate: props.student?.startDate ?? todayIso(),
  monthlyFee: props.student?.monthlyFee ?? 170000,
  poolFee: props.student?.poolFee ?? 0,
  paid: true,
});
const paidThrough = ref(props.student?.paidThrough ?? '');
const saving = ref(false);

const ageLabel = computed(() => {
  const age = ageFrom(form.birthDate);
  return age === null ? '' : `${age} ${age === 1 ? 'año' : 'años'}.`;
});

const coverageLabel = computed(() =>
  form.startDate ? formatShortDate(addMonthsIso(form.startDate, 1), true) : ''
);

const paidThroughHint = computed(() => {
  if (!paidThrough.value) return '';
  const status = getStatus(paidThrough.value);
  return `Con esta fecha queda: ${STATUS_LABEL[status]} · ${dueLabel(paidThrough.value).toLowerCase()}.`;
});

const submit = async () => {
  saving.value = true;
  try {
    if (props.student) {
      await studentsStore.updateStudent(props.student._id, {
        name: form.name,
        phone: form.phone,
        document: form.document,
        birthDate: form.birthDate,
        startDate: form.startDate,
        monthlyFee: form.monthlyFee,
        poolFee: form.poolFee,
        paidThrough: paidThrough.value,
      });
      $q.notify({ message: 'Cambios guardados', color: 'positive' });
    } else {
      await studentsStore.addStudent({ ...form });
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
.student-form {
  display: flex;
  flex-direction: column;
  background: var(--sw-bg);
}

.student-form__bar {
  flex-shrink: 0;
  border-bottom: 1px solid var(--sw-border);
  padding-top: env(safe-area-inset-top);
}

.student-form__bar-inner {
  max-width: 640px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
}

.student-form__title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
}

.student-form__form {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.student-form__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.student-form__inner {
  max-width: 640px;
  margin: 0 auto;
  padding: 20px 16px;
}

.student-form__section {
  & + & {
    margin-top: 28px;
  }

  > .sw-overline {
    margin-bottom: 12px;
  }
}

.student-form__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

@media (min-width: 600px) {
  .student-form__grid {
    grid-template-columns: 1fr 1fr;
  }

  .student-form__span-2 {
    grid-column: span 2;
  }
}

.student-form__status {
  margin-top: 16px;
}

.student-form__chips {
  display: flex;
  gap: 8px;
}

.student-form__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--sw-border);
  background: var(--sw-bg);
  color: var(--sw-text);
  font: inherit;
  font-size: 0.8125rem;
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
    color: #0e4f7e;
  }
}

.student-form__hint {
  margin-top: 8px;
  font-size: 0.8125rem;
  color: var(--sw-text-2);
}

.student-form__footer {
  flex-shrink: 0;
  border-top: 1px solid var(--sw-border);
  background: var(--sw-bg);
  padding-bottom: env(safe-area-inset-bottom);

  .student-form__inner {
    padding: 12px 16px;
  }
}
</style>
