<template>
  <!-- Logo oficial (app/public/logos/logo.jpg), tal cual, sin recrear. -->
  <span
    class="app-logo"
    :class="{ 'app-logo--tile': tile }"
    :style="{ width: `${size}px`, height: `${size}px` }"
  >
    <img src="/logos/logo.jpg" alt="Swimming is Cool · Training Center" class="app-logo__img" />
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number; tile?: boolean }>(), {
  size: 40,
  tile: true,
});
</script>

<style scoped>
.app-logo {
  display: inline-block;
  flex-shrink: 0;
  overflow: hidden;
  background: #fff;
}

.app-logo--tile {
  border-radius: 22%;
}

.app-logo__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
