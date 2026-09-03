<template>
  <component
    :is="clickable ? 'button' : 'div'"
    :type="clickable ? 'button' : undefined"
    class="stat"
    :class="{ 'stat--clickable': clickable, 'stat--accent': accent }"
    @click="clickable && $emit('click')"
  >
    <div
      class="stat__value sw-heading"
      :class="[valueClass, { 'stat__value--long': isLong, 'stat__value--xlong': isXLong }]"
    >
      {{ value }}
    </div>
    <div class="stat__label">{{ label }}</div>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    label: string;
    value: string | number;
    clickable?: boolean;
    accent?: boolean;
    valueClass?: string;
  }>(),
  { clickable: false, accent: false, valueClass: '' }
);

defineEmits<{ (e: 'click'): void }>();

// Cifras largas ("$1.870.000") bajan de tamaño para no cortarse en móvil.
const length = computed(() => String(props.value).length);
const isLong = computed(() => length.value > 8);
const isXLong = computed(() => length.value > 11);
</script>

<style scoped lang="scss">
.stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 12px 12px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #fff;
  text-align: left;
  font: inherit;

  &--accent {
    background: rgba(255, 255, 255, 0.22);
    border-color: rgba(255, 255, 255, 0.32);
  }

  &--clickable {
    cursor: pointer;
    transition: background 120ms var(--sw-ease);

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    &:focus-visible {
      outline: 2px solid #fff;
      outline-offset: 2px;
    }
  }
}

.stat__value {
  font-size: clamp(1.0625rem, 4.4vw, 1.375rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat__value--long {
  font-size: clamp(0.9375rem, 3.6vw, 1.25rem);
}

.stat__value--xlong {
  font-size: clamp(0.8125rem, 3vw, 1.125rem);
}

.stat__label {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.72);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat__chevron {
  opacity: 0.7;
}
</style>
