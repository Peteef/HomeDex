import { z } from 'zod';

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
