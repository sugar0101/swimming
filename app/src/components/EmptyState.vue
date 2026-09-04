<template>
  <!-- Estado vacío estándar: icono en chip + título corto, centrado. -->
  <div class="empty" :style="{ minHeight }">
    <div class="empty__icon">
      <q-icon :name="icon" size="28px" />
    </div>
    <div class="empty__title">{{ title }}</div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    icon: string;
    title: string;
    // Alto mínimo del bloque: las listas de página usan uno mayor para
    // centrar en el espacio restante de la pantalla.
    minHeight?: string;
  }>(),
  { minHeight: '260px' }
);
</script>

<style scoped lang="scss">
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px 16px;
}

.empty__icon {
  width: 60px;
  height: 60px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--sw-primary-tint);
  color: var(--sw-primary);
  margin-bottom: 14px;
}

.empty__title {
  font-family: var(--sw-font-heading);
  font-weight: 700;
  font-size: 1.0625rem;
}
</style>
