# swimming (app)

Frontend Quasar 2 (Vite) + Vue 3 + Pinia + vue-i18n + zod, con Firebase
(proyecto `swimming-639f1`). Misma estructura que la app de piddo.

    npm install
    npm run dev        # http://localhost:9000 (lee .env.local)
    npm run build
    npm run lint

Con los emuladores levantados (desde `../functions`: `npm run serve`) la app
en modo dev se conecta sola a Auth, Firestore, Storage, Functions y RTDB
locales.
