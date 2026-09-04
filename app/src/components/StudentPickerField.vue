<template>
  <div>
    <span class="sw-overline sw-overline--plain sw-field__label">{{ label }}</span>

    <!-- Con alumno elegido: tarjeta con X para quitarlo. -->
    <div v-if="modelValue" class="spf__card">
      <span class="spf__avatar">{{ initials }}</span>
      <span class="spf__body">
        <span class="spf__name">{{ modelValue.name }}</span>
        <span v-if="modelValue.phone" class="spf__phone">{{ modelValue.phone }}</span>
      </span>
      <q-btn
        v-if="removable"
        flat
        round
        dense
        size="sm"
        icon="sym_o_close"
        class="spf__remove"
        aria-label="Quitar alumno"
        @click="$emit('update:modelValue', null)"
      />
    </div>

    <!-- Sin alumno: botón que abre el diálogo de búsqueda. -->
    <button v-else type="button" class="spf__choose" @click="openPicker">
      <q-icon name="sym_o_person_search" size="20px" />
      Elegir alumno
      <q-icon name="sym_o_chevron_right" size="18px" class="spf__chevron" />
    </button>

    <div v-if="error" class="spf__error">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import StudentPickerDialog from 'src/components/StudentPickerDialog.vue';
import { StudentDoc } from 'src/models/Student';

// Campo "alumno": muestra la tarjeta del elegido (con X para quitarlo) o un
// botón que abre el diálogo de búsqueda/selección.
const props = withDefaults(
  defineProps<{
    modelValue: StudentDoc | null;
    label?: string;
    removable?: boolean;
    error?: string;
  }>(),
  { label: 'Alumno', removable: true, error: '' }
);

const emit = defineEmits<{ (e: 'update:modelValue', value: StudentDoc | null): void }>();

const $q = useQuasar();

const openPicker = () => {
  $q.dialog({ component: StudentPickerDialog }).onOk((student: StudentDoc) => {
    emit('update:modelValue', student);
  });
};

const initials = computed(() =>
  (props.modelValue?.name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
);
</script>

<style scoped lang="scss">
.sw-field__label {
  display: block;
  margin-bottom: 6px;
}

.spf__card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--sw-primary-border);
  border-radius: 14px;
  background: var(--sw-primary-tint);
}

.spf__avatar {
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
  background: var(--sw-bg);
  color: #0e5c8a;
}

.spf__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.spf__name {
  font-weight: 600;
  font-size: 0.9375rem;
  color: #0e5c8a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.spf__phone {
  font-size: 0.7813rem;
  color: var(--sw-text-2);
}

.spf__remove {
  color: #0e5c8a;
}

.spf__choose {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 52px;
  padding: 0 14px;
  border: 1px dashed var(--sw-border-strong);
  border-radius: 14px;
  background: var(--sw-bg);
  font: inherit;
  font-size: 0.9063rem;
  font-weight: 600;
  color: var(--sw-text-2);
  cursor: pointer;
  transition: border-color 120ms var(--sw-ease), color 120ms var(--sw-ease);

  &:hover {
    border-color: var(--sw-primary);
    color: var(--sw-primary);
  }

  &:focus-visible {
    outline: 2px solid var(--sw-primary);
    outline-offset: 2px;
  }
}

.spf__chevron {
  margin-left: auto;
  color: var(--sw-text-3);
}

.spf__error {
  margin-top: 4px;
  font-size: 0.75rem;
  color: var(--sw-danger);
}
</style>
