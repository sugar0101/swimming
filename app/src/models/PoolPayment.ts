import { z } from 'zod';
import { IsoDateSchema } from './Student';

// Pago del servicio de piscina (arriendo, mantenimiento…): es el gasto que
// se resta de lo recaudado.
export const PoolPaymentSchema = z.object({
  concept: z.string().min(1),
  amount: z.number().nonnegative(),
  date: IsoDateSchema,
  month: z.string().regex(/^\d{4}-\d{2}$/),
  // Alumno al que corresponde este pago de piscina (los pagos manuales,
  // como arriendo o mantenimiento, no llevan alumno).
  studentId: z.string().optional(),
  createdAt: z.unknown().optional(),
});

export type PoolPayment = z.infer<typeof PoolPaymentSchema>;
export type PoolPaymentDoc = PoolPayment & { _id: string };
