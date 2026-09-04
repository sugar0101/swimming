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
          <h2 class="sw-modal__title">Registrar pago</h2>
        </div>
      </header>

      <q-form class="sw-modal__form" @submit.prevent="submit">
        <div class="sw-modal__scroll">
          <div class="sw-modal__inner">
            <!-- Alumno fijo (detalle) o elegido con el diálogo de búsqueda. -->
            <student-picker-field
              v-if="fixedStudent"
              :model-value="fixedStudent"
              :removable="false"
            />
            <student-picker-field v-else v-model="pickedStudent" :error="studentError" />

            <!-- Con alumno elegido: lo que se va a registrar, editable. -->
            <template v-if="selected">
              <div class="reg-pay__status">
                Estado actual: <b>{{ dueLabel(selected.paidThrough) }}</b>
              </div>

              <section class="sw-card reg-pay__card">
                <span class="sw-overline">Este cobro</span>

                <div class="reg-pay__grid">
                  <money-field
                    v-model="form.amount"
                    label="Mensualidad"
                    field-id="reg-pay-fee"
                    placeholder="170.000"
                  />

                  <money-field v-model="form.poolFee" label="Piscina" field-id="reg-pay-pool" />

                  <div class="reg-pay__span-2">
                    <date-field
                      v-model="form.coversUntil"
                      label="Paga hasta"
                      field-id="reg-pay-covers"
                      required-message="Elige la fecha"
                    />
                    <div class="reg-pay__hint">
                      El alumno queda al día hasta esta fecha.
                    </div>
                  </div>
                </div>
              </section>
            </template>
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
              label="Registrar pago"
              :disable="!selected"
              :loading="saving"
            />
          </div>
        </footer>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useDialogPluginComponent, useQuasar } from 'quasar';
import DateField from 'src/components/DateField.vue';
import MoneyField from 'src/components/MoneyField.vue';
import StudentPickerField from 'src/components/StudentPickerField.vue';
import { StudentDoc } from 'src/models/Student';
import { useStudentsStore } from 'src/stores/students-store';
import { coverageAfterPayment, dueLabel } from 'src/utils/subscription';

// Se abre con $q.dialog({ component: RegisterPaymentDialog }):
// - sin props, se elige el alumno (página de Pagos);
// - con `studentId`, el alumno viene fijo (detalle del alumno).
// Al elegir alumno se muestran, editables, la mensualidad, el pago de
// piscina (0 = este cobro no registra piscina) y hasta cuándo queda pagado.
const props = defineProps<{ studentId?: string | null }>();

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

const $q = useQuasar();
const studentsStore = useStudentsStore();

const fixedStudent = computed(() =>
  props.studentId
    ? studentsStore.activeStudents.find((s) => s._id === props.studentId) ?? null
    : null
);

const pickedStudent = ref<StudentDoc | null>(null);
const studentError = ref('');

// Siempre se lee la versión viva del store.
const selected = computed(() => {
  const id = props.studentId ?? pickedStudent.value?._id ?? null;
  return id ? studentsStore.activeStudents.find((s) => s._id === id) ?? null : null;
});

// Lo que se va a registrar: nace del alumno elegido y se puede ajustar.
const form = reactive({ amount: 0, poolFee: 0, coversUntil: '' });

watch(
  () => selected.value?._id,
  () => {
    const s = selected.value;
    if (!s) return;
    form.amount = s.monthlyFee;
    form.poolFee = s.poolFee;
    form.coversUntil = coverageAfterPayment(s);
    studentError.value = '';
  },
  { immediate: true }
);

const saving = ref(false);

const submit = async () => {
  if (!selected.value) {
    studentError.value = 'Elige el alumno';
    return;
  }
  studentError.value = '';
  saving.value = true;
  try {
    await studentsStore.registerPayment(selected.value, {
      amount: form.amount,
      poolFee: form.poolFee,
      coversUntil: form.coversUntil,
    });
    $q.notify({ message: 'Pago registrado', color: 'positive' });
    onDialogOK();
  } catch (error) {
    console.error(error);
    $q.notify({ message: 'No se pudo registrar el pago.', color: 'negative' });
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped lang="scss">
.reg-pay__status {
  font-size: 0.875rem;
  color: var(--sw-text-2);

  b {
    color: var(--sw-text);
    font-weight: 600;
  }
}

.reg-pay__card {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.reg-pay__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

@media (min-width: 480px) {
  .reg-pay__grid {
    grid-template-columns: 1fr 1fr;
  }

  .reg-pay__span-2 {
    grid-column: span 2;
  }
}

.reg-pay__hint {
  margin-top: 8px;
  font-size: 0.8125rem;
  color: var(--sw-text-2);
}
</style>
