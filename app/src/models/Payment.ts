import { z } from 'zod';
import { IsoDateSchema } from './Student';

// Pago de mensualidad de un alumno.
export const PaymentSchema = z.object({
  studentId: z.string(),
  studentName: z.string(),
  amount: z.number().nonnegative(),
  date: IsoDateSchema,
  // 'yyyy-MM' del día del pago: permite sumar el mes con una sola igualdad
  // (sin índices compuestos).
  month: z.string().regex(/^\d{4}-\d{2}$/),
  // Hasta qué fecha deja pagada la mensualidad.
  coversUntil: IsoDateSchema,
  // Costo de piscina del alumno en el momento del pago (snapshot): las
  // analíticas del mes lo restan del neto.
  poolFee: z.number().nonnegative().default(0),
  createdAt: z.unknown().optional(),
});

export type Payment = z.infer<typeof PaymentSchema>;
export type PaymentDoc = Payment & { _id: string };
