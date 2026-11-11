import { ApiError } from '../../http/client.ts';
import { TOO_MANY_REQUESTS, UNAUTHORIZED } from '../../http/status.ts';

export interface FieldErrors {
  username?: string;
  password?: string;
}

const USERNAME_REQUIRED = 'Enter your username.';
const PASSWORD_REQUIRED = 'Enter your password.';
const WRONG_CREDENTIALS = 'Wrong username or password.';
const TOO_MANY_ATTEMPTS = 'Too many failed attempts. Try again in a few minutes.';
const UNEXPECTED_FAILURE = 'Something went wrong. Try again.';

const FAILURE_MESSAGES: Record<number, string> = {
  [UNAUTHORIZED]: WRONG_CREDENTIALS,
  [TOO_MANY_REQUESTS]: TOO_MANY_ATTEMPTS,
};

export const fieldErrors = (username: string, password: string): FieldErrors => ({
  ...(username.trim() === '' && { username: USERNAME_REQUIRED }),
  ...(password === '' && { password: PASSWORD_REQUIRED }),
});

export const loginFailureMessage = (error: unknown): string =>
  (error instanceof ApiError ? FAILURE_MESSAGES[error.status] : undefined) ?? UNEXPECTED_FAILURE;
