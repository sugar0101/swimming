import { z } from 'zod';

// Fechas como 'yyyy-MM-dd' (string) para que sean legibles en Firestore y
// no dependan de la zona horaria del dispositivo.
export const IsoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida');

export const StudentSchema = z.object({
  name: z.string().min(1),
  phone: z.string().default(''),
  // Documento de identidad y fecha de nacimiento: opcionales ('' si no hay).
  // La edad se calcula desde birthDate para que nunca quede desactualizada.
  document: z.string().default(''),
  birthDate: IsoDateSchema.or(z.literal('')).default(''),
  startDate: IsoDateSchema,
  monthlyFee: z.number().nonnegative(),
  // Hasta qué fecha está pagada la mensualidad. Es la fecha de vencimiento.
  paidThrough: IsoDateSchema,
  active: z.boolean().default(true),
  createdAt: z.unknown().optional(),
  updatedAt: z.unknown().optional(),
});

export type Student = z.infer<typeof StudentSchema>;
export type StudentDoc = Student & { _id: string };

export type StudentInput = {
  name: string;
  phone: string;
  document: string;
  birthDate: string;
  startDate: string;
  monthlyFee: number;
  paid: boolean;
};

// Campos que se pueden corregir al editar: los datos personales y también
// el vencimiento, por si un cobro quedó mal registrado.
export type StudentUpdate = Omit<StudentInput, 'paid'> & { paidThrough: string };
