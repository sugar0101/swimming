import { z } from 'zod';
import { IsoDateSchema } from './Student';

// Sesión de entrenamiento de un alumno: la bitácora de su proceso.
export const SessionSchema = z.object({
  studentId: z.string(),
  date: IsoDateSchema,
  // Desempeño de la sesión, 1..5 (null si no se calificó).
  rating: z.number().min(1).max(5).nullable().default(null),
  // Nota del entrenador: qué se trabajó, avances, pendientes.
  note: z.string().default(''),
  createdAt: z.unknown().optional(),
  updatedAt: z.unknown().optional(),
});

export type Session = z.infer<typeof SessionSchema>;
export type SessionDoc = Session & { _id: string };
