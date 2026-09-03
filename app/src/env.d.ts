/* eslint-disable */

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    VUE_ROUTER_MODE: 'hash' | 'history' | 'abstract' | undefined;
    VUE_ROUTER_BASE: string | undefined;
    FUNCTIONS_ENDPOINT: string | undefined;
    USE_AUTH_EMULATOR: string | undefined;
    FIREBASE_EMULATOR_SUITE_URL: string | undefined;
    LOCALHOST: string | undefined;
    APK_URL: string | undefined;
  }
}
