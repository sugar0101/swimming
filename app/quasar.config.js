// Configuration for your app
// https://v2.quasar.dev/quasar-cli-vite/quasar-config-file
import 'dotenv/config';
import { defineConfig } from '#q-app/wrappers';
import { optimizeLodashImports } from '@optimize-lodash/rollup-plugin';

export default defineConfig(function (/* ctx */) {
  return {
    // app boot file (/src/boot)
    // https://v2.quasar.dev/quasar-cli-vite/boot-files
    boot: ['i18n', 'axios', 'env', 'firebase'],

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#css
    css: ['app.scss'],

    // https://github.com/quasarframework/quasar/tree/dev/extras
    extras: [
      'fontawesome-v6',
      'roboto-font',
      'material-icons',
      'material-icons-outlined',
      'material-symbols-outlined',
    ],

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#build
    build: {
      target: {
        browser: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
        node: 'node20',
      },

      typescript: {
        strict: true,
        vueShim: true,
      },

      vueRouterMode: 'history', // available values: 'hash', 'history'

      env: {
        FUNCTIONS_ENDPOINT: process.env.FUNCTIONS_ENDPOINT,
        USE_AUTH_EMULATOR: process.env.USE_AUTH_EMULATOR,
        FIREBASE_EMULATOR_SUITE_URL: process.env.FIREBASE_EMULATOR_SUITE_URL,
        LOCALHOST: process.env.LOCALHOST,
        // URL del APK. Por defecto se sirve desde /downloads en el hosting, pero en
        // el plan Spark Firebase Hosting rechaza ejecutables: apunta a Drive/GitHub.
        APK_URL: process.env.APK_URL,
      },

      rawDefine: {
        // vue-i18n (build esm-bundler) espera estos flags.
        __VUE_I18N_FULL_INSTALL__: true,
        __VUE_I18N_LEGACY_API__: false,
        __INTLIFY_PROD_DEVTOOLS__: false,
      },

      extendViteConf(viteConf) {
        viteConf.logLevel = 'info';

        // Pre-empaquetar las dependencias pesadas en el arranque del dev
        // server: si Vite las descubre tarde re-optimiza y fuerza recargas.
        viteConf.optimizeDeps = viteConf.optimizeDeps ?? {};
        viteConf.optimizeDeps.include = [
          '@vueuse/core',
          'axios',
          'date-fns',
          'firebase/app',
          'firebase/auth',
          'firebase/database',
          'firebase/firestore',
          'firebase/functions',
          'firebase/storage',
          'lodash',
          'vue-i18n',
          'zod',
        ];

        viteConf.esbuild = {
          ...viteConf.esbuild,
          legalComments: 'none',
        };

        // Solo en build: en dev reescribe los imports de lodash a subpaths
        // que Vite descubre tarde y fuerzan recargas.
        viteConf.plugins.push({
          ...optimizeLodashImports(),
          apply: 'build',
        });

        viteConf.build = {
          ...viteConf.build,
          rollupOptions: {
            ...viteConf?.build?.rollupOptions,
            output: {
              ...viteConf?.build?.rollupOptions?.output,
              manualChunks: {
                lodash: ['lodash'],
              },
            },
          },
        };
      },

      vitePlugins: [],
    },

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#devserver
    devServer: {
      // PORT lo inyecta el preview de Claude Code cuando el 9000 está ocupado.
      port: process.env.PORT ? Number(process.env.PORT) : 9000,
      open: true,
    },

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#framework
    framework: {
      cssAddon: true,
      // Meses y días en español para q-date y demás componentes.
      lang: 'es',
      plugins: ['Cookies', 'Dialog', 'Notify', 'Loading', 'SessionStorage'],
      config: {
        notify: {
          timeout: 1000,
        },
        loading: {
          delay: 100,
        },
      },
    },

    // https://v2.quasar.dev/options/animations
    animations: [],
  };
});
