import { z } from 'zod';
import { AccountError } from '../errors.ts';

export const MAX_USERNAME_LENGTH = 32;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

export const usernameSchema = z
  .string()
  .min(1, 'Username is required')
  .max(MAX_USERNAME_LENGTH, `Username must be at most ${String(MAX_USERNAME_LENGTH)} characters`)
  .regex(/^[A-Za-z0-9._-]+$/, 'Username may contain only letters, digits, ".", "_" and "-"');

export const passwordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Password must be at least ${String(MIN_PASSWORD_LENGTH)} characters`)
  .max(MAX_PASSWORD_LENGTH, `Password must be at most ${String(MAX_PASSWORD_LENGTH)} characters`);

export const validate = <T>(schema: z.ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new AccountError('invalid', result.error.issues[0]?.message ?? 'Invalid value');
  }

  return result.data;
};
