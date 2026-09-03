<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="download">
        <div class="download__inner">
          <header class="download__hero">
            <img
              src="/logos/logo.jpg"
              alt="Swimming is Cool · Training Center"
              class="download__logo"
            />
            <h1 class="download__title sw-heading">Instala la app en tu Android</h1>
            <p class="download__intro">
              Lleva el control de alumnos y mensualidades en el teléfono o la tablet,
              con acceso directo desde la pantalla de inicio.
            </p>
          </header>

          <q-btn
            unelevated
            no-caps
            color="primary"
            class="sw-btn download__button"
            icon="sym_o_download"
            label="Descargar app (.apk)"
            :loading="checking"
            @click="onDownload"
          />
          <div class="download__meta">
            <q-icon name="sym_o_android" size="16px" />
            Solo Android. Se instala desde el archivo <code>swimming.apk</code>, no desde Google Play.
          </div>

          <section class="download__section">
            <span class="sw-overline">Pasos</span>
            <ol class="download__steps">
              <li>Desde tu teléfono Android, toca <strong>Descargar app (.apk)</strong>.</li>
              <li>
                Abre <strong>swimming.apk</strong> desde la notificación de descarga o en
                <strong>Archivos → Descargas</strong>.
              </li>
              <li>
                Si Android pregunta, activa <strong>Permitir de esta fuente</strong> para el
                navegador y vuelve atrás.
              </li>
              <li>Toca <strong>Instalar</strong> y espera a que termine.</li>
              <li>Abre <strong>Swimming is Cool</strong> e inicia sesión con tu cuenta.</li>
            </ol>
          </section>

          <section class="download__section">
            <span class="sw-overline" style="--sw-dot: var(--sw-warning)">Ten en cuenta</span>
            <ul class="download__notes">
              <li>
                Play Protect puede mostrar un aviso por instalar fuera de Google Play. Toca
                <strong>Instalar de todas formas</strong>.
              </li>
              <li>
                Cuando haya una versión nueva, vuelve a esta página, descarga el
                <code>.apk</code> e instálalo encima: no pierdes nada.
              </li>
            </ul>
          </section>

          <router-link to="/login" class="download__back">
            <q-icon name="sym_o_arrow_back" size="16px" />
            Volver al inicio de sesión
          </router-link>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();
// Firebase Hosting en plan Spark rechaza ejecutables (.apk): el archivo se
// publica fuera (Drive, GitHub Releases…) y su URL llega por APK_URL. Si no
// hay, se intenta /downloads/swimming.apk (funciona en plan Blaze).
const externalUrl = (process.env.APK_URL ?? '').trim();
const downloadUrl = externalUrl || '/downloads/swimming.apk';
const checking = ref(false);

// El hosting reescribe las rutas inexistentes a /index.html: si el APK aún
// no está publicado, un enlace directo descargaría el HTML de la app. Antes
// de descargar comprobamos que la URL devuelva un archivo de verdad.
const onDownload = async (event: Event) => {
  event.preventDefault();

  // Enlace externo: se abre directo (Drive/GitHub no permiten HEAD desde el navegador).
  if (externalUrl) {
    window.open(externalUrl, '_blank', 'noopener');
    return;
  }

  checking.value = true;
  try {
    const res = await fetch(downloadUrl, { method: 'HEAD', cache: 'no-store' });
    const type = res.headers.get('content-type') || '';

    if (!res.ok || type.includes('text/html')) {
      $q.notify({
        type: 'warning',
        message: 'La app aún no está disponible para descargar.',
        caption: 'Vuelve a intentarlo más tarde.',
        position: 'top',
      });
      return;
    }

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'swimming.apk';
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch {
    // Ante un fallo de red, dejamos que el navegador intente abrir la URL.
    window.location.href = downloadUrl;
  } finally {
    checking.value = false;
  }
};
</script>

<style scoped lang="scss">
.download {
  background: var(--sw-bg);
}

.download__inner {
  max-width: 520px;
  margin: 0 auto;
  padding: 32px 20px 48px;
}

.download__hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 20px;
}

.download__logo {
  width: 220px;
  max-width: 100%;
  height: auto;
  display: block;
}

.download__title {
  margin: 0 0 8px;
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.15;
}

.download__intro {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.5;
  color: var(--sw-text-2);
}

.download__button {
  width: 100%;
  height: 52px;
  border-radius: 999px;
}

.download__meta {
  margin: 12px 0 28px;
  text-align: center;
  font-size: 0.8125rem;
  line-height: 1.6;
  color: var(--sw-text-2);

  .q-icon {
    vertical-align: -3px;
    margin-right: 4px;
  }
}

.download__section {
  margin-bottom: 24px;

  .sw-overline {
    margin-bottom: 8px;
  }
}

.download__steps,
.download__notes {
  margin: 0;
  padding-left: 1.25rem;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--sw-text);

  li + li {
    margin-top: 8px;
  }

  li::marker {
    color: var(--sw-primary);
    font-weight: 700;
  }
}

code {
  padding: 1px 6px;
  border-radius: 6px;
  background: var(--sw-surface-2);
  font-size: 0.8125rem;
}

.download__back {
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
