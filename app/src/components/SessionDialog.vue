<template>
  <q-dialog
    ref="dialogRef"
    position="bottom"
    transition-show="jump-up"
    transition-hide="jump-down"
    :transition-duration="320"
    @hide="onDialogHide"
  >
    <q-card class="sw-sheet">
      <div class="sw-sheet__grip" />

      <div class="session-form__header">
        <div>
          <h2 class="session-form__title sw-heading">
            {{ isEdit ? 'Editar sesión' : 'Registrar sesión' }}
          </h2>
          <div class="session-form__student">{{ studentName }}</div>
        </div>
        <q-btn flat round dense icon="sym_o_close" aria-label="Cerrar" v-close-popup />
      </div>

      <q-form class="session-form" @submit.prevent="submit">
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
              <q-icon name="sym_o_star" size="26px" />
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

        <q-btn
          unelevated
          no-caps
          type="submit"
          color="primary"
          class="sw-btn full-width q-mt-sm"
          :label="isEdit ? 'Guardar cambios' : 'Registrar sesión'"
          :loading="saving"
        />
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
import { SessionDoc } from 'src/models/Session';
import { todayIso } from 'src/utils/dates';

// Se abre con $q.dialog({ component: SessionDialog, componentProps }):
// sin `session` registra una nueva; con `session` la edita.
const props = defineProps<{
  studentId: string;
  studentName: string;
  session?: SessionDoc | null;
}>();

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

const $q = useQuasar();

const isEdit = computed(() => !!props.session);

const form = reactive({
  date: props.session?.date ?? todayIso(),
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
  saving.value = true;
  try {
    if (props.session) {
      await updateDoc(doc(db, `sessions/${props.session._id}`), {
        date: form.date,
        rating: form.rating,
        note: form.note.trim(),
        updatedAt: serverTimestamp(),
      });
      $q.notify({ message: 'Sesión actualizada', color: 'positive' });
    } else {
      await addDoc(collection(db, 'sessions'), {
        studentId: props.studentId,
        date: form.date,
        rating: form.rating,
        note: form.note.trim(),
        createdAt: serverTimestamp(),
      });
      $q.notify({ message: 'Sesión registrada', color: 'positive' });
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
.session-form__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 14px;
}

.session-form__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.session-form__student {
  font-size: 0.8125rem;
  color: var(--sw-text-2);
}

.session-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

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
  min-height: 88px;
  padding: 10px 14px;
}
</style>
