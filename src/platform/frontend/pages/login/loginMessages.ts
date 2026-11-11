import type { ParseKeys } from 'i18next';
import { TOO_MANY_REQUESTS, UNAUTHORIZED } from '../../../shared/http/status.ts';
import { ApiError } from '../../lib/http/index.ts';

export type LoginMessage = ParseKeys;

const FAILURE_MESSAGES: Record<number, LoginMessage> = {
  [UNAUTHORIZED]: 'login.errors.wrongPassword',
  [TOO_MANY_REQUESTS]: 'login.errors.tooManyAttempts',
};

export const passwordError = (password: string): LoginMessage | undefined =>
  password === '' ? 'login.errors.passwordRequired' : undefined;

export const loginFailureMessage = (error: unknown): LoginMessage =>
  (error instanceof ApiError ? FAILURE_MESSAGES[error.status] : undefined) ??
  'login.errors.unexpected';
