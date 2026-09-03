<template>
  <q-dialog
    v-model="open"
    position="bottom"
    :maximized="false"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="sw-sheet">
      <div class="sw-sheet__grip" />

      <div class="student-form__header">
        <h2 class="student-form__title sw-heading">
          {{ isEdit ? 'Editar alumno' : 'Nuevo alumno' }}
        </h2>
        <q-btn flat round dense icon="sym_o_close" aria-label="Cerrar" v-close-popup />
      </div>

      <q-form class="student-form" @submit.prevent="submit">
        <div class="student-form__grid">
          <div class="sw-field">
            <label class="sw-overline sw-overline--plain sw-field__label" for="student-name">
              Nombre del alumno
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

          <div class="sw-field">
            <label class="sw-overline sw-overline--plain sw-field__label" for="student-start">
              Fecha de inicio
            </label>
            <q-input
              for="student-start"
              v-model="form.startDate"
              borderless
              type="date"
              :rules="[(v) => !!v || 'Elige la fecha']"
              hide-bottom-space
            />
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
        </div>

        <div v-if="!isEdit" class="student-form__status">
          <span class="sw-overline sw-overline--plain sw-field__label">Estado de la mensualidad</span>
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

        <q-btn
          unelevated
          no-caps
          type="submit"
          color="primary"
          class="sw-btn full-width q-mt-md"
          :label="isEdit ? 'Guardar cambios' : 'Agregar alumno'"
          :loading="saving"
        />
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { StudentDoc, StudentInput } from 'src/models/Student';
import { useStudentsStore } from 'src/stores/students-store';
import { addMonthsIso, formatShortDate, todayIso } from 'src/utils/dates';

const props = defineProps<{
  modelValue: boolean;
  student?: StudentDoc | null;
}>();

const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>();

const $q = useQuasar();
const studentsStore = useStudentsStore();

const open = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const isEdit = computed(() => !!props.student);

const emptyForm = (): StudentInput => ({
  name: '',
  phone: '',
  startDate: todayIso(),
  monthlyFee: 170000,
  paid: true,
});

const form = reactive<StudentInput>(emptyForm());
const saving = ref(false);

watch(
  () => props.modelValue,
  (value) => {
    if (!value) return;
    const source = props.student;
    Object.assign(form, emptyForm());
    if (source) {
      form.name = source.name;
      form.phone = source.phone;
      form.startDate = source.startDate;
      form.monthlyFee = source.monthlyFee;
    }
  }
);

const coverageLabel = computed(() =>
  form.startDate ? formatShortDate(addMonthsIso(form.startDate, 1), true) : ''
);

const submit = async () => {
  saving.value = true;
  try {
    if (props.student) {
      await studentsStore.updateStudent(props.student._id, form);
      $q.notify({ message: 'Cambios guardados', color: 'positive' });
    } else {
      await studentsStore.addStudent({ ...form });
      $q.notify({ message: `${form.name.trim()} agregado`, color: 'positive' });
    }
    open.value = false;
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
.student-form__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.student-form__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.student-form__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

@media (min-width: 600px) {
  .student-form__grid {
    grid-template-columns: 1fr 1fr;
  }
}

.student-form__status {
  margin-top: 14px;
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
</style>
