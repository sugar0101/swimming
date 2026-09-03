<template>
  <div class="not-found">
    <div class="not-found__code sw-heading">404</div>
    <div class="not-found__title">Esta página no existe</div>
    <q-btn
      unelevated
      no-caps
      color="primary"
      class="sw-btn q-mt-lg"
      to="/"
      label="Volver al inicio"
    />
  </div>
</template>

<script setup lang="ts"></script>

<style scoped lang="scss">
.not-found {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
  background: var(--sw-bg);
  color: var(--sw-text);
}

.not-found__code {
  font-size: 3rem;
  font-weight: 800;
  color: var(--sw-primary);
}

.not-found__title {
  margin-top: 4px;
  color: var(--sw-text-2);
}
</style>
