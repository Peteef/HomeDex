import { BAD_REQUEST, INTERNAL_SERVER_ERROR, UNAUTHORIZED } from '../../../shared/http/status.ts';
import { ApiError } from './errors.ts';

const API_BASE = '/api';
const JSON_HEADERS = { 'Content-Type': 'application/json' };
const EMPTY_BODY = {};

export const isUnauthorized = (error: unknown): boolean =>
  error instanceof ApiError && error.status === UNAUTHORIZED;

export const isClientError = (error: unknown): boolean =>
  error instanceof ApiError && error.status >= BAD_REQUEST && error.status < INTERNAL_SERVER_ERROR;

const request = async (method: string, path: string, init: RequestInit = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'same-origin',
    ...init,
  });

  if (!response.ok) {
    throw new ApiError(response.status, `${method} ${path} failed with ${String(response.status)}`);
  }

  return response;
};

// The backend rejects a write without a JSON content type (CSRF defence), so every write sends
// one, with an empty object when there is nothing to send.
const write = (method: string, path: string, body: unknown) =>
  request(method, path, { headers: JSON_HEADERS, body: JSON.stringify(body) });

export const getJson = async <T>(path: string): Promise<T> =>
  (await request('GET', path)).json() as Promise<T>;

export const postForJson = async <T>(path: string, body: unknown = EMPTY_BODY): Promise<T> =>
  (await write('POST', path, body)).json() as Promise<T>;

export const post = async (path: string, body: unknown = EMPTY_BODY): Promise<void> => {
  await write('POST', path, body);
};

export const put = async (path: string, body: unknown = EMPTY_BODY): Promise<void> => {
  await write('PUT', path, body);
};

export const del = async (path: string): Promise<void> => {
  await write('DELETE', path, EMPTY_BODY);
};
