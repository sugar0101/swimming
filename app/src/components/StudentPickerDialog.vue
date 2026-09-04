<template>
  <q-dialog
    ref="dialogRef"
    transition-show="jump-up"
    transition-hide="jump-down"
    :transition-duration="280"
    @hide="onDialogHide"
  >
    <q-card class="picker">
      <header class="picker__bar">
        <button type="button" class="sw-modal__back" aria-label="Volver" v-close-popup>
          <q-icon name="sym_o_chevron_left" size="22px" />
        </button>
        <h2 class="picker__title sw-heading">Elegir alumno</h2>
      </header>

      <div class="sw-field picker__search">
        <q-input
          v-model="search"
          borderless
          dense
          autofocus
          clearable
          clear-icon="sym_o_close"
          placeholder="Buscar por nombre o teléfono"
        >
          <template #prepend>
            <q-icon name="sym_o_search" size="20px" />
          </template>
        </q-input>
      </div>

      <div class="picker__list">
        <div v-if="filtered.length === 0" class="picker__empty">
          Ningún alumno coincide con la búsqueda.
        </div>

        <button
          v-for="student in filtered"
          :key="student._id"
          type="button"
          class="picker__row"
          @click="pick(student)"
        >
          <span class="picker__avatar">{{ initialsOf(student.name) }}</span>
          <span class="picker__body">
            <span class="picker__name">{{ student.name }}</span>
            <span v-if="student.phone" class="picker__phone">{{ student.phone }}</span>
          </span>
          <q-icon name="sym_o_chevron_right" size="18px" class="picker__chevron" />
        </button>
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { StudentDoc } from 'src/models/Student';
import { useStudentsStore } from 'src/stores/students-store';

// Diálogo de búsqueda y selección de alumno. Se abre con
// $q.dialog({ component: StudentPickerDialog }) y devuelve el alumno
// elegido en onOk.
defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

const studentsStore = useStudentsStore();
const search = ref('');

const filtered = computed(() => {
  const term = (search.value ?? '').trim().toLowerCase();
  return studentsStore.activeStudents
    .filter((s) => !term || s.name.toLowerCase().includes(term) || s.phone.includes(term))
    .sort((a, b) => a.name.localeCompare(b.name));
});

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

const pick = (student: StudentDoc) => onDialogOK(student);
</script>

<style scoped lang="scss">
.picker {
  width: min(480px, calc(100vw - 32px));
  height: min(600px, calc(100vh - 64px));
  display: flex;
  flex-direction: column;
  background: var(--sw-bg);
  border-radius: 22px !important;
  box-shadow: 0 24px 64px rgba(16, 24, 40, 0.22);
}

.picker__bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px 0;
}

.picker__title {
  margin: 0;
  font-size: 1.1875rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.picker__search {
  padding: 14px 20px 0;
}

.picker__list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 12px 16px;
}

.picker__empty {
  padding: 24px 10px;
  font-size: 0.875rem;
  color: var(--sw-text-2);
  text-align: center;
}

.picker__row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border: 0;
  border-radius: 14px;
  background: transparent;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 120ms var(--sw-ease);

  &:hover {
    background: var(--sw-surface-2);
  }

  &:focus-visible {
    outline: 2px solid var(--sw-primary);
    outline-offset: -2px;
  }
}

.picker__avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--sw-font-heading);
  font-weight: 700;
  font-size: 0.75rem;
  flex-shrink: 0;
  background: var(--sw-primary-tint);
  color: #0e5c8a;
}

.picker__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.picker__name {
  font-weight: 600;
  font-size: 0.9375rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.picker__phone {
  font-size: 0.7813rem;
  color: var(--sw-text-2);
}

.picker__chevron {
  color: var(--sw-text-3);
  flex-shrink: 0;
}
</style>
