# swimming

Plataforma para escuelas y clubes de natación. Mismo stack que piddo:

- `app/`: Quasar 2 (Vite) + Vue 3 + TypeScript + Pinia + vue-i18n + zod + Firebase SDK.
- `functions/`: Cloud Functions (Node 22, TypeScript, bundle con esbuild).
- Raíz: config de Firebase (`firebase.json`, reglas de Firestore/RTDB/Storage, índices).

Proyecto de Firebase: `swimming-639f1` (cuenta `ccencisoj@gmail.com`).

## Qué hace hoy

Control de mensualidades de "Swimming is Cool" (Granada, Meta), pensado para tablet y móvil:

- Login con correo/contraseña (Firebase Auth). Rutas protegidas.
- Una sola vista (`/`): banda azul con la marca y seis tarjetas del mes (alumnos, al día,
  deben, recaudado, piscina, neto) y debajo la lista de alumnos.
- Alumnos: filtros por estado (todos / deben / vencen pronto / al día), buscador cuando hay
  más de 6, "carril" con el tiempo transcurrido del mes pagado y botón "Nuevo alumno"
  (flotante en móvil). Al tocar un alumno se abre su hoja de detalle: registrar pago
  (extiende un mes), recordar por WhatsApp, editar y eliminar.
- Caja: al tocar las tarjetas de dinero se abre la hoja "Caja del mes" con el neto y su
  desglose, los pagos de piscina (agregar/eliminar) y las mensualidades cobradas.
- Marca: logo oficial en `app/public/logos/logo.jpg` (tal cual, sin recrear); los favicons y
  los iconos de la app Android se generan desde él. Paleta con sus azules (`#137cb8`
  primario, banda `#0e4f7e → #2aa3d8`).
- Página pública de descarga en `/download/app`: botón que baja
  `app/public/downloads/swimming.apk` con los pasos de instalación en Android.

## App Android (APK)

Está en `mobile/` (Expo + WebView sobre la web, igual que `piddo/mobile`). Lo sencillo:

```bash
cd mobile && npm install && npm run apk
```

Eso compila el APK y lo deja en `app/public/downloads/swimming.apk`. Sin Android SDK,
usa EAS: `npm run build:apk` (ver `mobile/README.md`).

**Dónde se publica el APK.** Firebase Hosting en el plan Spark rechaza ejecutables
("Executable files are forbidden on the Spark billing plan"), así que `firebase.json`
ignora los `.apk` al desplegar. Opciones:

1. Subir `swimming.apk` a Google Drive (o GitHub Releases) con enlace público y poner esa
   URL en `app/.env` como `APK_URL=https://...`; luego `npm run deploy`. El botón de
   `/download/app` abrirá ese enlace.
2. Pasar el proyecto al plan Blaze: quita `**/*.apk` del `ignore` de `firebase.json` y el
   APK se sirve desde `/downloads/swimming.apk` sin más.

Datos en Firestore: `students`, `payments`, `poolPayments` (ver `firestore.rules`).
El patrón visual sale de [docs/design-dna.json](docs/design-dna.json) (extraído con la skill
`design-dna` de la referencia "Vitality"); las nuevas pantallas deben partir de esos tokens
(`app/src/css/app.scss`).

## Desarrollo

```bash
# Terminal 1: emuladores (auth, firestore, functions, storage, rtdb, ui en :4000)
cd functions && npm install && npm run serve

# Terminal 2: app en http://localhost:9000
cd app && npm install && npm run dev
```

En modo dev la app se conecta sola a los emuladores (ver `app/src/boot/firebase.ts`).
Los datos del emulador de Firestore se guardan en `functions/local-firestore`.
El emulador de Realtime Database no se levanta (se cae en Windows y aún no se usa);
en el login hay un botón "Crear cuenta de prueba (emulador)" solo visible en dev.

## Deploy

Desde la raíz del repo (sirve en PowerShell, cmd y bash):

```bash
npm run deploy          # build de app/ + firebase deploy --only hosting
npm run deploy:rules    # reglas e índices de Firestore y RTDB
npm run emulators       # emuladores (functions/)
npm run apk             # APK Android → app/public/downloads/swimming.apk
```

> En Windows PowerShell 5.1 no existe `&&`: `cd app && npm run deploy` falla con
> "The token '&&' is not a valid statement separator". Usa los scripts de la raíz o
> separa con `;` (`cd app; npm run deploy`).

Functions en producción (requiere plan Blaze): `cd functions` y `npm run deploy`.

## Producción

- URL: https://swimming-639f1.web.app (Firebase Hosting; `cd app && npm run deploy`).
- Cuenta por defecto en Auth: `yeison@gmail.com` (creada el 2026-09-02; la contraseña la
  definió el dueño del proyecto). Más usuarios: consola de Firebase → Authentication → Agregar usuario.
- Sin plan Blaze no hay Functions en producción: el doc `authorization/{uid}` no se crea solo,
  pero la app no lo necesita todavía (las reglas de alumnos/pagos solo piden sesión iniciada).

## Estado del proyecto en Firebase

- Firestore: creado (nam5), reglas desplegadas (todo cerrado salvo `users/{uid}` y `authorization/{uid}` para el propio usuario).
- Realtime Database: creada (`swimming-639f1-default-rtdb`, us-central1), reglas desplegadas.
- Web app registrada: `1:409278531197:web:3a309743c202da2be1d314`.
- Authentication: inicializada, proveedor Correo/Contraseña activo.
  En dev la app usa el emulador de Auth (`USE_AUTH_EMULATOR=true` en `app/.env.local`).
- Storage y Cloud Functions en producción: requieren activar el plan Blaze (el proyecto no tiene facturación).
  En dev ambos funcionan con los emuladores.
