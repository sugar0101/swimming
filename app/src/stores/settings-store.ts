import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from 'src/boot/firebase';
import { useDocument } from 'src/composables/firebase';
import { SettingsSchema } from 'src/models/Settings';

// Configuración de la escuela: valores por defecto de mensualidad y piscina.
// Un solo doc (`settings/general`) compartido por todos los dispositivos.
export const useSettingsStore = defineStore('settings', () => {
  const settingsRef = ref(doc(db, 'settings/general'));
  const { document, loading } = useDocument(settingsRef, SettingsSchema);

  const monthlyFee = computed(() => document.value?.monthlyFee ?? 170000);
  const poolFee = computed(() => document.value?.poolFee ?? 0);

  const save = async (input: { monthlyFee: number; poolFee: number }) => {
    await setDoc(
      doc(db, 'settings/general'),
      {
        monthlyFee: input.monthlyFee,
        poolFee: input.poolFee,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  return { loading, monthlyFee, poolFee, save };
});
