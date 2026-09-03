import { z } from 'zod';
import { defineBoot as boot } from '#q-app/wrappers';

const EnvSchema = z.object({
  FUNCTIONS_ENDPOINT: z.string().optional(),
  USE_AUTH_EMULATOR: z
    .enum(['0', '1', 'true', 'false'])
    .catch('true')
    .transform((value) => value === 'true' || value === '1'),
  FIREBASE_EMULATOR_SUITE_URL: z.string().optional(),
  LOCALHOST: z.string().default('localhost'),
});

export type Env = z.infer<typeof EnvSchema>;

export let env: Env;

export default boot(() => {
  const processEnv: unknown = {
    FUNCTIONS_ENDPOINT: process.env.FUNCTIONS_ENDPOINT,
    USE_AUTH_EMULATOR: process.env.USE_AUTH_EMULATOR,
    FIREBASE_EMULATOR_SUITE_URL: process.env.FIREBASE_EMULATOR_SUITE_URL,
    LOCALHOST: process.env.LOCALHOST,
  };

  env = EnvSchema.parse(processEnv);
});
