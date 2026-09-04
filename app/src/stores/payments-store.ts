import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from 'src/boot/firebase';
import { useCollection } from 'src/composables/firebase';
import { useAuthStore } from 'src/stores/auth-store';
import { PaymentSchema } from 'src/models/Payment';
import { PoolPaymentSchema } from 'src/models/PoolPayment';
import { currentMonthIso, fromIsoDate, toIsoMonth } from 'src/utils/dates';

// Pagos de mensualidad y pagos de piscina del mes en curso.
export const usePaymentsStore = defineStore('payments', () => {
  const month = ref(currentMonthIso());

  const authStore = useAuthStore();

  // Sin sesión no hay consultas: al cerrar sesión se cortan las
  // suscripciones y al volver a entrar se crean frescas.
  const paymentsQuery = computed(() =>
    authStore.isAuthenticated
      ? query(collection(db, 'payments'), where('month', '==', month.value))
      : null
  );
  const poolQuery = computed(() =>
    authStore.isAuthenticated
      ? query(collection(db, 'poolPayments'), where('month', '==', month.value))
      : null
  );

  const { documents: payments, loading: loadingPayments } = useCollection(
    paymentsQuery,
    PaymentSchema
  );
  const { documents: poolPayments, loading: loadingPool } = useCollection(
    poolQuery,
    PoolPaymentSchema
  );

  // Piscina del mes = pagos de piscina registrados + snapshots legados que
  // venían dentro de la mensualidad.
  const poolManualCost = computed(() =>
    poolPayments.value.reduce((sum, p) => sum + p.amount, 0)
  );
  const poolStudentCost = computed(() =>
    payments.value.reduce((sum, p) => sum + p.poolFee, 0)
  );
  const poolCost = computed(() => poolManualCost.value + poolStudentCost.value);

  // Recaudado = TODO lo que entra en el mes: mensualidades + piscina (la
  // piscina también se le cobra al alumno). Neto = recaudado − piscina.
  const paymentsSum = computed(() =>
    payments.value.reduce((sum, p) => sum + p.amount, 0)
  );
  const collected = computed(() => paymentsSum.value + poolCost.value);
  const net = computed(() => collected.value - poolCost.value);

  const sortedPoolPayments = computed(() =>
    [...poolPayments.value].sort((a, b) => (a.date < b.date ? 1 : -1))
  );

  const addPoolPayment = async (input: {
    concept: string;
    amount: number;
    date: string;
  }) => {
    await addDoc(collection(db, 'poolPayments'), {
      concept: input.concept.trim(),
      amount: input.amount,
      date: input.date,
      month: toIsoMonth(fromIsoDate(input.date)),
      createdAt: serverTimestamp(),
    });
  };

  const removePoolPayment = async (id: string) => {
    await deleteDoc(doc(db, `poolPayments/${id}`));
  };

  return {
    month,
    payments,
    poolPayments: sortedPoolPayments,
    loading: computed(() => loadingPayments.value || loadingPool.value),
    collected,
    poolManualCost,
    poolStudentCost,
    poolCost,
    net,
    addPoolPayment,
    removePoolPayment,
  };
});
