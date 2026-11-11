import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { fakeApi, status, TEST_USER, testQueryClient } from './helpers.tsx';
import { getJson } from '../lib/http/index.ts';

const SESSION_KEY = ['session'];

const queryThings = (queryClient = testQueryClient()) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const { result } = renderHook(
    () => useQuery({ queryKey: ['things'], queryFn: () => getJson('/things') }),
    { wrapper },
  );

  return result;
};

describe('app query client', () => {
  it('should not retry a request when the server answers with a client error', async () => {
    // Given
    const api = fakeApi({ 'GET /api/things': status(403) });

    // When
    const result = queryThings();

    // Then
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(api.calls).toHaveLength(1);
  });

  it('should retry a request three times when the server fails', async () => {
    // Given
    const api = fakeApi({ 'GET /api/things': status(503) });

    // When
    const result = queryThings();

    // Then
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(api.calls).toHaveLength(4);
  });

  it('should end the session when any request gets a 401', async () => {
    // Given
    fakeApi({ 'GET /api/things': status(401) });
    const queryClient = testQueryClient();
    queryClient.setQueryData(SESSION_KEY, TEST_USER);

    // When
    const result = queryThings(queryClient);

    // Then
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(queryClient.getQueryData(SESSION_KEY)).toBeNull();
  });
});
