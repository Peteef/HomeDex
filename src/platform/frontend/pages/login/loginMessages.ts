import { TOO_MANY_REQUESTS, UNAUTHORIZED } from '../../../shared/http/status.ts';
import { ApiError } from '../../lib/http/index.ts';

const PASSWORD_REQUIRED = 'Enter your password.';
const WRONG_PASSWORD = "That's not the right password. Try again.";
const TOO_MANY_ATTEMPTS = 'Too many failed attempts. Try again in a few minutes.';
const UNEXPECTED_FAILURE = 'Something went wrong. Try again.';

const FAILURE_MESSAGES: Record<number, string> = {
  [UNAUTHORIZED]: WRONG_PASSWORD,
  [TOO_MANY_REQUESTS]: TOO_MANY_ATTEMPTS,
};

export const passwordError = (password: string): string | undefined =>
  password === '' ? PASSWORD_REQUIRED : undefined;

export const loginFailureMessage = (error: unknown): string =>
  (error instanceof ApiError ? FAILURE_MESSAGES[error.status] : undefined) ?? UNEXPECTED_FAILURE;
