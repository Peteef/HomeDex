import { TOO_MANY_REQUESTS, UNAUTHORIZED } from '../../../../shared/http/status.ts';
import { ApiError } from '../../../lib/http/index.ts';
import type en from '../../../locales/en.ts';

export type LoginError = keyof (typeof en)['login']['errors'];

const FAILURES: Record<number, LoginError> = {
  [UNAUTHORIZED]: 'wrongPassword',
  [TOO_MANY_REQUESTS]: 'tooManyAttempts',
};

export const passwordError = (password: string): LoginError | undefined =>
  password === '' ? 'passwordRequired' : undefined;

export const loginFailure = (error: unknown): LoginError =>
  (error instanceof ApiError ? FAILURES[error.status] : undefined) ?? 'unexpected';
