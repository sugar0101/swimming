import { initializeApp } from 'firebase/app';
import {
  connectFirestoreEmulator,
  initializeFirestore,
} from 'firebase/firestore';
import { defineBoot as boot } from '#q-app/wrappers';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';

// Config pública de la web app "swimming" (firebase apps:sdkconfig WEB).
const firebaseConfig = {
  apiKey: 'AIzaSyACvBiqPTNGriOG9qkn-6zAbCdmg6qse7w',
  authDomain: 'swimming-639f1.firebaseapp.com',
  projectId: 'swimming-639f1',
  storageBucket: 'swimming-639f1.firebasestorage.app',
  messagingSenderId: '409278531197',
  appId: '1:409278531197:web:3a309743c202da2be1d314',
  // Realtime Database: presencia y datos efímeros (Firestore guarda lo durable).
  databaseURL: 'https://swimming-639f1-default-rtdb.firebaseio.com',
};

const firebaseApp = initializeApp(firebaseConfig);

const db = initializeFirestore(firebaseApp, {
  experimentalAutoDetectLongPolling: true,
  experimentalLongPollingOptions: {
    timeoutSeconds: 30,
  },
});
const auth = getAuth(firebaseApp);
const storage = getStorage(firebaseApp);
const functions = getFunctions(firebaseApp);
const rtdb = getDatabase(firebaseApp);

// Host de los emuladores: el MISMO desde el que se sirvió la app (localhost
// en el navegador de la máquina, o la IP LAN cuando se abre desde el
// teléfono).
export const localhost =
  typeof window !== 'undefined' ? window.location.hostname : 'localhost';

// Fuera del boot a propósito: a veces el emulador de auth falla si se
// conecta dentro de la función boot.
if (process.env.DEV && process.env.USE_AUTH_EMULATOR == 'true') {
  connectAuthEmulator(auth, `http://${localhost}:9099`, {
    disableWarnings: true,
  });
}

export default boot(() => {
  if (process.env.DEV) {
    connectFirestoreEmulator(db, localhost, 8081);
    connectStorageEmulator(storage, localhost, 9199);
    connectFunctionsEmulator(functions, localhost, 5001);
    // 9002 y no 9000: el dev server de Quasar ya ocupa el 9000.
    connectDatabaseEmulator(rtdb, localhost, 9002);
  }
});

export { auth, db, storage, functions, rtdb, firebaseApp };
