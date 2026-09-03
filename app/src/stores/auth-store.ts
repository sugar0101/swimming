import { defineStore } from 'pinia';
import { computed, readonly, ref } from 'vue';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { auth } from 'src/boot/firebase';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const ready = ref(false);

  let resolveReady: () => void = () => undefined;
  const readyPromise = new Promise<void>((resolve) => {
    resolveReady = resolve;
  });

  onAuthStateChanged(auth, (firebaseUser) => {
    user.value = firebaseUser;
    if (!ready.value) {
      ready.value = true;
      resolveReady();
    }
  });

  // El guard del router espera aquí antes de decidir a dónde mandar.
  const waitUntilReady = () => readyPromise;

  const isAuthenticated = computed(() => user.value !== null);
  const userId = computed(() => user.value?.uid ?? null);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  // Solo en dev (emulador): crea una cuenta de prueba al vuelo.
  const registerDev = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email.trim(), password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return {
    user: readonly(user),
    ready: readonly(ready),
    isAuthenticated,
    userId,
    waitUntilReady,
    login,
    registerDev,
    logout,
  };
});
