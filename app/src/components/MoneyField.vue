<template>
  <div class="sw-field">
    <label v-if="label" class="sw-overline sw-overline--plain sw-field__label" :for="fieldId">
      {{ label }}
    </label>
    <q-input
      :for="fieldId"
      :model-value="display"
      borderless
      inputmode="numeric"
      prefix="$"
      :placeholder="placeholder"
      :rules="rules"
      hide-bottom-space
      @update:model-value="onInput"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// Campo de dinero: el modelo es un número, pero se escribe y se lee con
// separador de miles ("120.000") para distinguir 1.000 de 100.000 de un
// vistazo. Vacío equivale a 0.
const props = withDefaults(
  defineProps<{
    modelValue: number;
    label?: string;
    fieldId?: string;
    placeholder?: string;
    // Valor mínimo exigido al validar (p. ej. 1 para montos obligatorios).
    min?: number;
    minMessage?: string;
  }>(),
  { label: '', fieldId: undefined, placeholder: '0', min: undefined, minMessage: 'Escribe el valor' }
);

const emit = defineEmits<{ (e: 'update:modelValue', value: number): void }>();

const display = computed(() =>
  props.modelValue > 0 ? props.modelValue.toLocaleString('es-CO') : ''
);

const onInput = (value: string | number | null) => {
  const digits = String(value ?? '').replace(/\D/g, '').slice(0, 12);
  emit('update:modelValue', digits ? Number(digits) : 0);
};

const rules = computed(() => {
  if (props.min === undefined) return undefined;
  const min = props.min;
  return [() => props.modelValue >= min || props.minMessage];
});
</script>
