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
import { StudentSchema, StudentDoc, StudentInput } from 'src/models/Student';
import { PaymentDoc } from 'src/models/Payment';
import { addMonthsIso, todayIso, toIsoMonth } from 'src/utils/dates';
import { getStatus } from 'src/utils/subscription';

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

  const updateStudent = async (
    id: string,
    input: Pick<StudentInput, 'name' | 'phone' | 'monthlyFee' | 'startDate'>
  ) => {
    await updateDoc(doc(db, `students/${id}`), {
      name: input.name.trim(),
      phone: input.phone.trim(),
      monthlyFee: input.monthlyFee,
      startDate: input.startDate,
      updatedAt: serverTimestamp(),
    });
  };

  // Registra el pago de una mensualidad: extiende un mes la cobertura
  // (desde el vencimiento, o desde hoy si ya venció hace tiempo) y crea el
  // doc de pago.
  const registerPayment = async (student: StudentDoc) => {
    const today = todayIso();
    const base = student.paidThrough < today ? today : student.paidThrough;
    const coversUntil = addMonthsIso(base, 1);

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

  // Deshace un cobro registrado por error: elimina el doc de pago y le
  // resta ese mes de cobertura al alumno (si el alumno ya no existe, solo
  // se elimina el pago).
  const undoPayment = async (payment: PaymentDoc) => {
    const batch = writeBatch(db);
    batch.delete(doc(db, `payments/${payment._id}`));

    const student = students.value.find((s) => s._id === payment.studentId);
    if (student) {
      batch.update(doc(db, `students/${student._id}`), {
        paidThrough: addMonthsIso(student.paidThrough, -1),
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
