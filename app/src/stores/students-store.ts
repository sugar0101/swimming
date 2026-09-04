import { defineStore } from 'pinia';
import { computed } from 'vue';
import {
  collection,
  deleteDoc,
  doc,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from 'src/boot/firebase';
import { useCollection } from 'src/composables/firebase';
import { useAuthStore } from 'src/stores/auth-store';
import { StudentSchema, StudentDoc, StudentInput, StudentUpdate } from 'src/models/Student';
import { PaymentDoc } from 'src/models/Payment';
import { addMonthsIso, prevCycleIso, todayIso, toIsoMonth } from 'src/utils/dates';
import { coverageAfterPayment, getStatus } from 'src/utils/subscription';

export const useStudentsStore = defineStore('students', () => {
  const authStore = useAuthStore();

  // Sin sesión no hay consulta: al cerrar sesión la suscripción se corta
  // en vez de quedarse viva chocando contra las reglas de Firestore.
  const studentsQuery = computed(() =>
    authStore.isAuthenticated
      ? query(collection(db, 'students'), orderBy('name'))
      : null
  );

  const { documents: students, loading } = useCollection(
    studentsQuery,
    StudentSchema
  );

  const activeStudents = computed(() =>
    students.value.filter((s) => s.active)
  );

  const counts = computed(() => {
    let alDia = 0;
    let deben = 0;
    for (const student of activeStudents.value) {
      if (getStatus(student.paidThrough) === 'debe') deben += 1;
      else alDia += 1;
    }
    return { total: activeStudents.value.length, alDia, deben };
  });

  const addStudent = async (input: StudentInput) => {
    const batch = writeBatch(db);
    const studentRef = doc(collection(db, 'students'));

    // Si ya pagó, queda cubierto un mes desde la fecha de inicio y se
    // registra ese primer pago; si debe, vence el mismo día de inicio.
    const paidThrough = input.paid
      ? addMonthsIso(input.startDate, 1)
      : input.startDate;

    batch.set(studentRef, {
      name: input.name.trim(),
      phone: input.phone.trim(),
      document: input.document.trim(),
      age: input.age,
      startDate: input.startDate,
      monthlyFee: input.monthlyFee,
      poolFee: input.poolFee,
      paidThrough,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // El pago se registra con la fecha de HOY (cuando entra el dinero),
    // aunque la cobertura corra desde la fecha de inicio. Mensualidad y
    // piscina se registran como pagos independientes.
    if (input.paid) {
      if (input.monthlyFee > 0) {
        batch.set(doc(collection(db, 'payments')), {
          studentId: studentRef.id,
          studentName: input.name.trim(),
          amount: input.monthlyFee,
          date: todayIso(),
          month: toIsoMonth(new Date()),
          coversUntil: paidThrough,
          poolFee: 0,
          createdAt: serverTimestamp(),
        });
      }

      if (input.poolFee > 0) {
        batch.set(doc(collection(db, 'poolPayments')), {
          concept: `Piscina · ${input.name.trim()}`,
          amount: input.poolFee,
          date: todayIso(),
          month: toIsoMonth(new Date()),
          studentId: studentRef.id,
          createdAt: serverTimestamp(),
        });
      }
    }

    await batch.commit();
  };

  const updateStudent = async (id: string, input: StudentUpdate) => {
    await updateDoc(doc(db, `students/${id}`), {
      name: input.name.trim(),
      phone: input.phone.trim(),
      document: input.document.trim(),
      age: input.age,
      monthlyFee: input.monthlyFee,
      poolFee: input.poolFee,
      startDate: input.startDate,
      paidThrough: input.paidThrough,
      updatedAt: serverTimestamp(),
    });
  };

  // Registra el pago de una mensualidad: la cobertura avanza al siguiente
  // ciclo anclado a la fecha de inicio (pagar tarde no corre el día de
  // corte del alumno). La mensualidad y la piscina se registran como pagos
  // INDEPENDIENTES: la mensualidad crea su doc en `payments` y la piscina
  // (si es > 0) crea su propio doc en `poolPayments`.
  const registerPayment = async (
    student: StudentDoc,
    options?: { amount?: number; poolFee?: number; coversUntil?: string }
  ) => {
    const today = todayIso();
    const month = toIsoMonth(new Date());
    const amount = options?.amount ?? student.monthlyFee;
    const poolFee = options?.poolFee ?? student.poolFee;
    const coversUntil = options?.coversUntil ?? coverageAfterPayment(student);

    const batch = writeBatch(db);
    batch.update(doc(db, `students/${student._id}`), {
      paidThrough: coversUntil,
      updatedAt: serverTimestamp(),
    });

    if (amount > 0) {
      batch.set(doc(collection(db, 'payments')), {
        studentId: student._id,
        studentName: student.name,
        amount,
        date: today,
        month,
        coversUntil,
        poolFee: 0,
        createdAt: serverTimestamp(),
      });
    }

    if (poolFee > 0) {
      batch.set(doc(collection(db, 'poolPayments')), {
        concept: `Piscina · ${student.name}`,
        amount: poolFee,
        date: today,
        month,
        studentId: student._id,
        createdAt: serverTimestamp(),
      });
    }

    await batch.commit();
  };

  // Deshace un cobro registrado por error: elimina el doc de pago y
  // retrocede la cobertura al ciclo anterior (si el alumno ya no existe,
  // solo se elimina el pago).
  const undoPayment = async (payment: PaymentDoc) => {
    const batch = writeBatch(db);
    batch.delete(doc(db, `payments/${payment._id}`));

    const student = students.value.find((s) => s._id === payment.studentId);
    if (student) {
      batch.update(doc(db, `students/${student._id}`), {
        paidThrough: prevCycleIso(student.startDate, student.paidThrough),
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
  };

  const removeStudent = async (id: string) => {
    await deleteDoc(doc(db, `students/${id}`));
  };

  return {
    students,
    activeStudents,
    loading,
    counts,
    addStudent,
    updateStudent,
    registerPayment,
    undoPayment,
    removeStudent,
  };
});
