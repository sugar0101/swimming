import Constants from 'expo-constants';

// Valores configurables desde app.json -> expo.extra (sin tocar código).
type Extra = {
  appUrl?: string;
  devAppUrl?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

// En desarrollo (dev-client / `__DEV__`) apuntamos al server local de la web
// (usa la IP LAN de tu PC, NO localhost: el teléfono no lo resuelve).
// En producción, al hosting de Firebase.
export const APP_URL = __DEV__
  ? extra.devAppUrl || 'http://192.168.1.12:9000'
  : extra.appUrl || 'https://swimming-639f1.web.app';
