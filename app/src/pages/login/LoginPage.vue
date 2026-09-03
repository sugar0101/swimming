<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="login">
        <div class="login__card">
          <div class="login__brand">
            <img
              src="/logos/logo.jpg"
              alt="Swimming is Cool · Training Center"
              class="login__logo"
            />
            <h1 class="login__title">Swimming is Cool</h1>
            <div class="login__subtitle">Control de alumnos · Granada, Meta</div>
          </div>

          <q-form class="login__form" @submit.prevent="submit">
            <div class="sw-field">
              <label class="sw-overline sw-overline--plain sw-field__label" for="login-email">
                Correo
              </label>
              <q-input
                for="login-email"
                v-model="email"
                borderless
                type="email"
                inputmode="email"
                autocomplete="email"
                placeholder="tu@correo.com"
                :rules="[(v) => !!v?.trim() || 'Escribe tu correo']"
                hide-bottom-space
              />
            </div>

            <div class="sw-field">
              <label class="sw-overline sw-overline--plain sw-field__label" for="login-password">
                Contraseña
              </label>
              <q-input
                for="login-password"
                v-model="password"
                borderless
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="••••••••"
                :rules="[(v) => !!v || 'Escribe tu contraseña']"
                hide-bottom-space
              >
                <template #append>
                  <q-btn
                    flat
                    round
                    dense
                    size="sm"
                    class="login__eye"
                    :icon="showPassword ? 'sym_o_visibility_off' : 'sym_o_visibility'"
                    :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                    @click="showPassword = !showPassword"
                  />
                </template>
              </q-input>
            </div>

            <q-btn
              unelevated
              no-caps
              type="submit"
              color="primary"
              class="sw-btn full-width"
              label="Entrar"
              :loading="loading"
            />

            <q-btn
              v-if="isDev"
              flat
              no-caps
              class="login__dev"
              label="Crear cuenta de prueba (emulador)"
              :loading="loading"
              @click="registerDev"
            />
          </q-form>
        </div>

        <router-link to="/download/app" class="login__download">
          <q-icon name="sym_o_android" size="18px" />
          Descargar la app para Android
        </router-link>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth-store';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const isDev = !!process.env.DEV;

const getSafeRedirectPath = (value: unknown): string => {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.startsWith('/login')
  ) {
    return '/';
  }
  return value;
};

const goHome = () => router.replace(getSafeRedirectPath(route.query.redirect));

const submit = async () => {
  loading.value = true;
  try {
    await authStore.login(email.value, password.value);
    await goHome();
  } catch (error) {
    console.error(error);
    $q.notify({
      message: 'Correo o contraseña incorrectos. Revisa y prueba de nuevo.',
      color: 'negative',
    });
  } finally {
    loading.value = false;
  }
};

const registerDev = async () => {
  if (!email.value.trim() || !password.value) {
    $q.notify({ message: 'Escribe un correo y una contraseña primero.', color: 'dark' });
    return;
  }
  loading.value = true;
  try {
    await authStore.registerDev(email.value, password.value);
    await goHome();
  } catch (error) {
    console.error(error);
    $q.notify({
      message: 'No se pudo crear la cuenta. ¿Está corriendo el emulador de Auth?',
      color: 'negative',
    });
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped lang="scss">
.login {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 24px 16px;
  background: var(--sw-surface-2);
}

.login__card {
  width: 100%;
  max-width: 400px;
  background: var(--sw-bg);
  border: 1px solid var(--sw-border);
  border-radius: var(--sw-radius-lg);
  padding: 20px 24px 28px;
}

.login__brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 16px;
}

// El logo ya trae el nombre: el título queda solo para lectores de pantalla.
.login__logo {
  width: 200px;
  max-width: 100%;
  height: auto;
  display: block;
}

.login__title {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

.login__subtitle {
  margin-top: -6px;
  font-size: 0.8125rem;
  color: var(--sw-text-2);
}

.login__form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.login__eye {
  color: var(--sw-text-2);
}

.login__dev {
  color: var(--sw-text-2);
  font-size: 0.8125rem;
}

.login__download {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--sw-text-2);
  text-decoration: none;

  &:hover {
    color: var(--sw-primary);
  }
}
</style>
