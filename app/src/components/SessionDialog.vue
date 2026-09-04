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
      <!-- Barra superior fija: título a la izquierda, cerrar a la derecha. -->
      <header class="sw-modal__bar">
        <div class="sw-modal__bar-inner">
          <button type="button" class="sw-modal__back" aria-label="Volver" v-close-popup>
            <q-icon name="sym_o_chevron_left" size="22px" />
          </button>
          <h2 class="sw-modal__title">
            {{ isEdit ? 'Editar asistencia' : 'Registrar asistencia' }}
          </h2>
        </div>
      </header>

      <q-form class="sw-modal__form" @submit.prevent="submit">
        <div class="sw-modal__scroll">
          <div class="sw-modal__inner">
            <!-- Alumno fijo (detalle del alumno o edición): tarjeta sin X. -->
            <student-picker-field
              v-if="fixedStudent"
              :model-value="fixedStudent"
              :removable="false"
            />
            <!-- Alumno a elegir (página de Asistencias). -->
            <student-picker-field
              v-else
              v-model="selectedStudent"
              :error="studentError"
            />

            <date-field
              v-model="form.date"
              label="Fecha"
              field-id="session-date"
              required-message="Elige la fecha"
            />

            <div>
              <span class="sw-overline sw-overline--plain session-form__label">Desempeño</span>
              <div class="session-form__stars" role="radiogroup" aria-label="Desempeño de 1 a 5">
                <button
                  v-for="n in 5"
                  :key="n"
                  type="button"
                  class="session-form__star"
                  :class="{ 'session-form__star--on': form.rating !== null && n <= form.rating }"
                  role="radio"
                  :aria-checked="form.rating === n"
                  :aria-label="`${n} de 5`"
                  @click="setRating(n)"
                >
                  <q-icon name="sym_o_star" size="28px" />
                </button>
              </div>
              <div class="session-form__hint">
                {{ ratingHint }}
              </div>
            </div>

            <div class="sw-field">
              <label class="sw-overline sw-overline--plain sw-field__label" for="session-note">
                Nota del entrenador
              </label>
              <q-input
                for="session-note"
                v-model="form.note"
                borderless
                type="textarea"
                autogrow
                placeholder="Ej: trabajamos patada de libre; mejoró la respiración, falta ritmo."
                hide-bottom-space
                class="session-form__note"
              />
            </div>
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
              :label="isEdit ? 'Guardar cambios' : 'Registrar asistencia'"
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
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from 'src/boot/firebase';
import DateField from 'src/components/DateField.vue';
import StudentPickerField from 'src/components/StudentPickerField.vue';
import { SessionDoc } from 'src/models/Session';
import { StudentDoc } from 'src/models/Student';
import { useStudentsStore } from 'src/stores/students-store';
import { todayIso } from 'src/utils/dates';

// Se abre con $q.dialog({ component: SessionDialog, componentProps }):
// - con `studentId`, la asistencia es de ese alumno (detalle del alumno);
// - sin `studentId`, el alumno se elige con el diálogo de búsqueda;
// - con `session` edita; sin `session` registra una nueva;
// - `defaultDate` preselecciona la fecha (día visible en Asistencias).
const props = defineProps<{
  studentId?: string | null;
  studentName?: string | null;
  session?: SessionDoc | null;
  defaultDate?: string;
}>();

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

const $q = useQuasar();
const studentsStore = useStudentsStore();

const isEdit = computed(() => !!props.session);

// Alumno fijo: viene por prop; se muestra como tarjeta sin X.
const fixedStudent = computed<StudentDoc | null>(() => {
  if (!props.studentId) return null;
  return (
    studentsStore.students.find((s) => s._id === props.studentId) ??
    ({ _id: props.studentId, name: props.studentName ?? 'Alumno' } as StudentDoc)
  );
});

const selectedStudent = ref<StudentDoc | null>(null);
const studentError = ref('');

const form = reactive({
  date: props.session?.date ?? props.defaultDate ?? todayIso(),
  rating: (props.session?.rating ?? null) as number | null,
  note: props.session?.note ?? '',
});
const saving = ref(false);

// Tocar la estrella ya elegida quita la calificación.
const setRating = (n: number) => {
  form.rating = form.rating === n ? null : n;
};

const RATING_LABEL = ['Muy flojo', 'Flojo', 'Normal', 'Bien', 'Excelente'];
const ratingHint = computed(() =>
  form.rating === null
    ? 'Opcional: toca las estrellas para calificar la sesión.'
    : RATING_LABEL[form.rating - 1]
);

const submit = async () => {
  const targetStudentId = props.studentId ?? selectedStudent.value?._id;
  if (!targetStudentId) {
    studentError.value = 'Elige el alumno';
    return;
  }
  studentError.value = '';

  saving.value = true;
  try {
    if (props.session) {
      await updateDoc(doc(db, `sessions/${props.session._id}`), {
        date: form.date,
        rating: form.rating,
        note: form.note.trim(),
        updatedAt: serverTimestamp(),
      });
      $q.notify({ message: 'Asistencia actualizada', color: 'positive' });
    } else {
      await addDoc(collection(db, 'sessions'), {
        studentId: targetStudentId,
        date: form.date,
        rating: form.rating,
        note: form.note.trim(),
        createdAt: serverTimestamp(),
      });
      $q.notify({ message: 'Asistencia registrada', color: 'positive' });
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
.session-form__label {
  display: flex;
  margin-bottom: 6px;
}

.session-form__stars {
  display: flex;
  gap: 4px;
}

.session-form__star {
  border: 0;
  background: transparent;
  padding: 4px;
  cursor: pointer;
  color: var(--sw-border-strong);
  transition: color 120ms var(--sw-ease), transform 120ms var(--sw-ease);

  &:active {
    transform: scale(1.15);
  }

  &--on {
    color: var(--sw-warning);
  }

  &:focus-visible {
    outline: 2px solid var(--sw-primary);
    outline-offset: 2px;
    border-radius: 6px;
  }
}

.session-form__hint {
  margin-top: 4px;
  font-size: 0.8125rem;
  color: var(--sw-text-2);
}

.session-form__note :deep(.q-field__control) {
  height: auto;
  min-height: 96px;
  padding: 10px 14px;
}
</style>
