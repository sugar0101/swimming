<template>
  <q-layout view="hHh Lpr fFf">
    <!-- Barra superior azul: marca + cerrar sesión arriba, navegación debajo. -->
    <header class="shell">
      <div class="shell__inner">
        <div class="shell__top">
          <router-link to="/" class="shell__brand" aria-label="Ir al resumen">
            <app-logo :size="38" class="shell__logo" />
            <span class="shell__name sw-heading">Swimming is Cool</span>
          </router-link>

          <q-btn
            flat
            no-caps
            dense
            class="shell__logout"
            icon="sym_o_logout"
            label="Cerrar sesión"
            @click="onLogout"
          />
        </div>

        <nav class="shell__nav" aria-label="Secciones">
          <router-link
            v-for="item in NAV"
            :key="item.to"
            :to="item.to"
            class="shell__tab"
            :class="{ 'shell__tab--active': isActive(item) }"
          >
            {{ item.label }}
          </router-link>
        </nav>
      </div>
    </header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import AppLogo from 'src/components/AppLogo.vue';
import { useAuthStore } from 'src/stores/auth-store';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const NAV = [
  { to: '/resumen', label: 'Resumen' },
  { to: '/alumnos', label: 'Alumnos' },
  { to: '/asistencias', label: 'Asistencias' },
  { to: '/pagos', label: 'Pagos' },
  { to: '/configuracion', label: 'Configuración' },
];

// El detalle de un alumno (/alumnos/:id) mantiene activa la pestaña Alumnos.
const isActive = (item: { to: string }) => route.path.startsWith(item.to);

const onLogout = async () => {
  await authStore.logout();
  await router.replace('/login');
};
</script>

<style scoped lang="scss">
.shell {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--sw-primary);
  color: #fff;
  padding-top: env(safe-area-inset-top);
}

.shell__inner {
  padding: 16px 24px 0;
}

@media (max-width: 599px) {
  .shell__inner {
    padding: 12px 16px 0;
  }
}

.shell__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.shell__brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: inherit;
  min-width: 0;

  &:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 2px;
    border-radius: 8px;
  }
}

.shell__logo {
  border-radius: 10px;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.35);
}

.shell__name {
  font-size: 1.0625rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.shell__logout {
  border-radius: 999px;
  height: 34px;
  padding: 0 12px;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 600;
  flex-shrink: 0;

  :deep(.q-btn__content) {
    font-size: 0.8125rem;
    gap: 6px;
  }

  &:hover {
    color: #fff;
  }
}

// Navegación: tabs con subrayado blanco, a ras del borde inferior de la barra.
.shell__nav {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.shell__tab {
  display: inline-flex;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 3px solid transparent;
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.78);
  text-decoration: none;
  white-space: nowrap;
  flex-shrink: 0;
  transition: color 120ms var(--sw-ease), border-color 120ms var(--sw-ease);

  &:hover {
    color: #fff;
  }

  &:focus-visible {
    outline: 2px solid #fff;
    outline-offset: -2px;
    border-radius: 6px;
  }

  &--active {
    color: #fff;
    font-weight: 700;
    border-bottom-color: #fff;
  }
}
</style>
