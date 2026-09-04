<template>
  <div class="sw-field">
    <label v-if="label" class="sw-overline sw-overline--plain sw-field__label" :for="fieldId">
      {{ label }}
    </label>
    <q-input
      :for="fieldId"
      :model-value="display"
      borderless
      readonly
      :placeholder="placeholder"
      :rules="rules"
      hide-bottom-space
      class="date-field"
    >
      <template #append>
        <q-icon
          v-if="clearable && modelValue"
          name="sym_o_close"
          size="18px"
          class="date-field__clear"
          role="button"
          aria-label="Quitar fecha"
          @click.stop="emit('update:modelValue', '')"
        />
        <q-icon name="sym_o_calendar_month" size="20px" />
      </template>

      <q-popup-proxy
        ref="popup"
        transition-show="jump-up"
        transition-hide="jump-down"
        :transition-duration="220"
      >
        <!-- minimal: sin la cabecera grande de Material, solo el calendario. -->
        <q-date
          :model-value="modelValue || null"
          minimal
          mask="YYYY-MM-DD"
          :options="limit"
          class="date-field__calendar"
          @update:model-value="pick"
        />
      </q-popup-proxy>
    </q-input>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { QPopupProxy } from 'quasar';
import { formatShortDate } from 'src/utils/dates';

// Campo de fecha con calendario q-date minimal en popup. El modelo es una
// ISO 'yyyy-MM-dd' ('' si está vacío); lo mostrado es la fecha en corto.
const props = defineProps<{
  modelValue: string;
  label?: string;
  fieldId?: string;
  placeholder?: string;
  // Mensaje de requerido; si no se pasa, el campo es opcional.
  requiredMessage?: string;
  // Cotas inclusivas en ISO (p. ej. max = hoy para fechas de nacimiento).
  min?: string;
  max?: string;
  clearable?: boolean;
}>();

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>();

const popup = ref<QPopupProxy | null>(null);

const display = computed(() =>
  props.modelValue ? formatShortDate(props.modelValue, true) : ''
);

const rules = computed(() => {
  const message = props.requiredMessage;
  if (!message) return undefined;
  return [() => !!props.modelValue || message];
});

// q-date entrega las fechas de `options` como 'YYYY/MM/DD'.
const limit = (date: string) => {
  const iso = date.replaceAll('/', '-');
  if (props.min && iso < props.min) return false;
  if (props.max && iso > props.max) return false;
  return true;
};

const pick = (value: string | null) => {
  emit('update:modelValue', value ?? '');
  popup.value?.hide();
};
</script>

<style scoped lang="scss">
.date-field {
  cursor: pointer;

  :deep(.q-field__control),
  :deep(.q-field__native) {
    cursor: pointer;
  }

  :deep(.q-field__append) {
    color: var(--sw-text-3);
    gap: 6px;
  }
}

.date-field__clear {
  cursor: pointer;

  &:hover {
    color: var(--sw-text);
  }
}
</style>

<style lang="scss">
// El calendario vive en un portal (fuera del componente): estilo global.
.date-field__calendar {
  border-radius: var(--sw-radius-lg);
  box-shadow: 0 18px 48px rgba(17, 24, 39, 0.18);

  .q-date__calendar-item .q-btn {
    font-weight: 600;
  }
}
</style>
