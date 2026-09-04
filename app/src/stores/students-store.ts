import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
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
import { StudentSchema, StudentDoc, StudentInput, StudentUpdate } from 'src/models/Student';
import { PaymentDoc } from 'src/models/Payment';
import { addMonthsIso, prevCycleIso, todayIso, toIsoMonth } from 'src/utils/dates';
import { coverageAfterPayment, getStatus } from 'src/utils/subscription';

export const useStudentsStore = defineStore('students', () => {
  const studentsQuery = ref(
    query(collection(db, 'students'), orderBy('name'))
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
      birthDate: input.birthDate,
      startDate: input.startDate,
      monthlyFee: input.monthlyFee,
      paidThrough,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // El pago se registra con la fecha de HOY (cuando entra el dinero),
    // aunque la cobertura corra desde la fecha de inicio.
    if (input.paid) {
      const paymentRef = doc(collection(db, 'payments'));
      batch.set(paymentRef, {
        studentId: studentRef.id,
        studentName: input.name.trim(),
        amount: input.monthlyFee,
        date: todayIso(),
        month: toIsoMonth(new Date()),
        coversUntil: paidThrough,
        createdAt: serverTimestamp(),
      });
    }

    await batch.commit();
  };

  const updateStudent = async (id: string, input: StudentUpdate) => {
    await updateDoc(doc(db, `students/${id}`), {
      name: input.name.trim(),
      phone: input.phone.trim(),
      document: input.document.trim(),
      birthDate: input.birthDate,
      monthlyFee: input.monthlyFee,
      startDate: input.startDate,
      paidThrough: input.paidThrough,
      updatedAt: serverTimestamp(),
    });
  };

  // Registra el pago de una mensualidad: la cobertura avanza al siguiente
  // ciclo anclado a la fecha de inicio (pagar tarde no corre el día de
  // corte del alumno) y crea el doc de pago.
  const registerPayment = async (student: StudentDoc) => {
    const today = todayIso();
    const coversUntil = coverageAfterPayment(student);

    const batch = writeBatch(db);
    batch.update(doc(db, `students/${student._id}`), {
      paidThrough: coversUntil,
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(collection(db, 'payments')), {
      studentId: student._id,
      studentName: student.name,
      amount: student.monthlyFee,
      date: today,
      month: toIsoMonth(new Date()),
      coversUntil,
      createdAt: serverTimestamp(),
    });
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
