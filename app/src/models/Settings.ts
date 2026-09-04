import { z } from 'zod';

// Valores por defecto de la escuela: se usan al crear un alumno nuevo.
// Vive en el doc único `settings/general`.
export const SettingsSchema = z.object({
  monthlyFee: z.number().nonnegative().default(170000),
  poolFee: z.number().nonnegative().default(0),
  updatedAt: z.unknown().optional(),
});

export type Settings = z.infer<typeof SettingsSchema>;
