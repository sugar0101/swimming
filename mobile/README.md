# Swimming is Cool · app Android

App nativa (React Native / Expo) que envuelve la web de `app/` en un WebView.
Misma estructura que `piddo/mobile`, sin notificaciones push por ahora.

## Generar el APK (lo sencillo)

Requisitos (una sola vez): Node 22, Java 17 y Android SDK (`ANDROID_HOME`),
los mismos que pide Android Studio.

```bash
cd mobile
npm install
npm run apk
```

`npm run apk` hace `expo prebuild`, compila el release con Gradle y deja el
archivo en **`app/public/downloads/swimming.apk`**. Después, publica la web
para que la descarga quede activa en `/download/app`:

```bash
cd ../app
npm run deploy
```

### Sin Android SDK (build en la nube con EAS)

```bash
npm install -g eas-cli
eas login
cd mobile
npm run build:apk        # eas build --profile preview --platform android
```

EAS da un enlace para descargar el `.apk`; cópialo a
`app/public/downloads/swimming.apk` y despliega la web.

> `newArchEnabled` va en `false` en `app.json` a propósito: con la nueva arquitectura
> Gradle compila C++ con rutas que superan los 260 caracteres de Windows y el build
> falla (`Filename longer than 260 characters`). Para un WebView no hace falta.

## Probar en un teléfono por USB

1. En el teléfono: Ajustes → Acerca del teléfono → toca 7 veces "Número de
   compilación"; luego Opciones de desarrollador → Depuración por USB.
2. `npm run devices` para confirmar que aparece.
3. `npm run android` compila, instala y abre la app (la 1ª vez tarda).
4. Para el día a día: `npm start` (arranca Metro y hace `adb reverse`).

En desarrollo la app carga `devAppUrl` de `app.json` (pon la IP LAN de tu PC,
no `localhost`) y necesita la web corriendo: `cd ../app && npm run dev`.
En el APK de producción carga `appUrl` (`https://swimming-639f1.web.app`).

## Estructura

```
mobile/
├─ App.tsx              WebView + botón atrás de Android
├─ index.js             entry (registerRootComponent)
├─ app.json             config Expo (nombre, icono, splash, package Android, URLs)
├─ eas.json             perfiles de build (preview = APK)
├─ assets/              icon / adaptive-icon / splash generados desde app/public/logos/logo.jpg
├─ scripts/build-apk.mjs  prebuild + gradle + copia a app/public/downloads/swimming.apk
└─ src/config.ts        APP_URL (dev / producción)
```
