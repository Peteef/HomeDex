import type { ParseKeys } from 'i18next';
import { TOO_MANY_REQUESTS, UNAUTHORIZED } from '../../../shared/http/status.ts';
import { ApiError } from '../../lib/http/index.ts';

export type LoginMessage = ParseKeys<'login'>;

const FAILURE_MESSAGES: Record<number, LoginMessage> = {
  [UNAUTHORIZED]: 'errors.wrongPassword',
  [TOO_MANY_REQUESTS]: 'errors.tooManyAttempts',
};

export const passwordError = (password: string): LoginMessage | undefined =>
  password === '' ? 'errors.passwordRequired' : undefined;

export const loginFailureMessage = (error: unknown): LoginMessage =>
  (error instanceof ApiError ? FAILURE_MESSAGES[error.status] : undefined) ?? 'errors.unexpected';
