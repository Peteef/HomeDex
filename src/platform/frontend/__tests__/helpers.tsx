import { QueryClientProvider } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { vi } from 'vitest';
import { App } from '../App.tsx';
import { appQueryClient } from '../queryClient.ts';

export const TEST_USER = { id: 1, username: 'Misty' };

export interface FakeResponse {
  status: number;
  body?: unknown;
}

export interface ApiCall {
  method: string;
  url: string;
  headers: Headers;
  body: unknown;
}

type Handler = FakeResponse | ((call: ApiCall) => FakeResponse | Promise<FakeResponse>);

export const ok = (body: unknown): FakeResponse => ({
  status: 200,
  body,
});
export const status = (code: number): FakeResponse => ({
  status: code,
  body: { error: 'fake' },
});
export const signedIn = (user = TEST_USER): FakeResponse => ok({ user });
export const signedOut = (): FakeResponse => status(401);
export const accountsList = (...usernames: string[]): FakeResponse =>
  ok({ accounts: usernames.map((username) => ({ username })) });

const NO_BODY_STATUSES = new Set([204]);

const toResponse = ({ status: code, body }: FakeResponse): Response =>
  NO_BODY_STATUSES.has(code) || body === undefined
    ? new Response(null, { status: code })
    : Response.json(body, { status: code });

const toCall = (url: string, init: RequestInit = {}): ApiCall => ({
  method: init.method ?? 'GET',
  url,
  headers: new Headers(init.headers),
  body: typeof init.body === 'string' ? (JSON.parse(init.body) as unknown) : undefined,
});

// Stubs the global fetch with a fake API keyed by "METHOD /api/path". Unknown routes answer 404,
// so a test fails loudly when the app calls something it did not expect.
export const fakeApi = (routes: Record<string, Handler>) => {
  const calls: ApiCall[] = [];

  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const call = toCall(url, init);
    calls.push(call);
    const handler = routes[`${call.method} ${call.url}`] ?? status(404);
    return toResponse(typeof handler === 'function' ? await handler(call) : handler);
  });

  vi.stubGlobal('fetch', fetchMock);
  return {
    calls,
    callsTo: (route: string) => calls.filter((call) => `${call.method} ${call.url}` === route),
  };
};

// The real client, so the tests cover the app's retry and sign-out rules, without retry delays.
export const testQueryClient = (): QueryClient => {
  const queryClient = appQueryClient();
  const queries = queryClient.getDefaultOptions().queries;
  queryClient.setDefaultOptions({ queries: { ...queries, retryDelay: 0 } });
  return queryClient;
};

export const withProviders = (
  children: ReactNode,
  {
    path = '/',
    queryClient = testQueryClient(),
  }: { path?: string; queryClient?: QueryClient } = {},
) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
  </QueryClientProvider>
);

export const renderApp = (path: string, queryClient = testQueryClient()) => {
  render(withProviders(<App />, { path, queryClient }));
  return { queryClient };
};
