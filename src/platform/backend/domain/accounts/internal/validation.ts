import { z } from 'zod';
import { AccountError } from '../errors.ts';

export const USERNAME_MAX_LENGTH = 32;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const usernameSchema = z
  .string()
  .min(1, 'Username is required')
  .max(USERNAME_MAX_LENGTH, `Username must be at most ${String(USERNAME_MAX_LENGTH)} characters`)
  .regex(/^[A-Za-z0-9._-]+$/, 'Username may contain only letters, digits, ".", "_" and "-"');

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${String(PASSWORD_MIN_LENGTH)} characters`)
  .max(PASSWORD_MAX_LENGTH, `Password must be at most ${String(PASSWORD_MAX_LENGTH)} characters`);

export const validate = <T>(schema: z.ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new AccountError('invalid', result.error.issues[0]?.message ?? 'Invalid value');
  }

  return result.data;
};
