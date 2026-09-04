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
import { PaymentSchema } from 'src/models/Payment';
import { PoolPaymentSchema } from 'src/models/PoolPayment';
import { currentMonthIso, fromIsoDate, toIsoMonth } from 'src/utils/dates';

// Pagos de mensualidad y pagos de piscina del mes en curso.
export const usePaymentsStore = defineStore('payments', () => {
  const month = ref(currentMonthIso());

  const paymentsQuery = computed(() =>
    query(collection(db, 'payments'), where('month', '==', month.value))
  );
  const poolQuery = computed(() =>
    query(collection(db, 'poolPayments'), where('month', '==', month.value))
  );

  const { documents: payments, loading: loadingPayments } = useCollection(
    paymentsQuery,
    PaymentSchema
  );
  const { documents: poolPayments, loading: loadingPool } = useCollection(
    poolQuery,
    PoolPaymentSchema
  );

  const collected = computed(() =>
    payments.value.reduce((sum, p) => sum + p.amount, 0)
  );
  // Piscina del mes = pagos manuales (arriendo, mantenimiento…) + lo que
  // se paga a la piscina por cada mensualidad cobrada (snapshot del pago).
  const poolManualCost = computed(() =>
    poolPayments.value.reduce((sum, p) => sum + p.amount, 0)
  );
  const poolStudentCost = computed(() =>
    payments.value.reduce((sum, p) => sum + p.poolFee, 0)
  );
  const poolCost = computed(() => poolManualCost.value + poolStudentCost.value);
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
