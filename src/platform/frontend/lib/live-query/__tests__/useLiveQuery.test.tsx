import { skipToken } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { act, fireEvent, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { testQueryClient, withProviders } from '../../../__tests__/helpers.tsx';
import { useLiveQuery } from '../index.ts';

const QUERY_KEY = ['live-query', 'test'];

const wrapperWith =
  (queryClient: QueryClient) =>
  ({ children }: { children: ReactNode }) =>
    withProviders(children, { queryClient });

const renderLoaded = async (
  load: () => Promise<string>,
  interval: { refreshIntervalMs?: number } = {},
) => {
  const hook = renderHook(() => useLiveQuery({ queryKey: QUERY_KEY, queryFn: load, ...interval }), {
    wrapper: wrapperWith(testQueryClient()),
  });

  await waitFor(() => {
    expect(hook.result.current.data).toBe('milk');
  });

  return hook;
};

describe('useLiveQuery', () => {
  it('should load the data when it mounts', async () => {
    // Given
    const load = vi.fn(() => Promise.resolve('milk'));

    // When
    const { result } = await renderLoaded(load);

    // Then
    expect(result.current.data).toBe('milk');
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('should load again every 15 seconds', async () => {
    // Given
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const load = vi.fn(() => Promise.resolve('milk'));
    await renderLoaded(load);

    // When
    await act(() => vi.advanceTimersByTimeAsync(15_000));

    // Then
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('should load again after the given interval when one is passed', async () => {
    // Given
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const load = vi.fn(() => Promise.resolve('milk'));
    await renderLoaded(load, { refreshIntervalMs: 5_000 });

    // When
    await act(() => vi.advanceTimersByTimeAsync(5_000));

    // Then
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('should load again when the window gets focus', async () => {
    // Given
    const load = vi.fn(() => Promise.resolve('milk'));
    await renderLoaded(load);

    // When
    fireEvent.focus(window);

    // Then
    await waitFor(() => {
      expect(load).toHaveBeenCalledTimes(2);
    });
  });

  it('should stop listening for focus when it unmounts', async () => {
    // Given
    const load = vi.fn(() => Promise.resolve('milk'));
    const { unmount } = await renderLoaded(load);
    unmount();

    // When
    fireEvent.focus(window);

    // Then
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('should not load when the window gets focus while the query is skipped', () => {
    // Given
    const queryClient = testQueryClient();

    const { result } = renderHook(
      () => useLiveQuery<string>({ queryKey: QUERY_KEY, queryFn: skipToken }),
      { wrapper: wrapperWith(queryClient) },
    );

    // When
    fireEvent.focus(window);

    // Then
    expect(queryClient.getQueryState(QUERY_KEY)?.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
  });

  it.each([
    [true, 'milk'],
    [false, undefined],
  ])(
    'should show the previous answer while another key loads when keepPrevious is %s',
    async (keepPrevious, shown) => {
      // Given
      const loads = {
        first: () => Promise.resolve('milk'),
        second: () => new Promise<string>(() => undefined),
      };

      const { result, rerender } = renderHook(
        ({ key }: { key: keyof typeof loads }) =>
          useLiveQuery({ queryKey: [...QUERY_KEY, key], queryFn: loads[key], keepPrevious }),
        { wrapper: wrapperWith(testQueryClient()), initialProps: { key: 'first' } },
      );

      await waitFor(() => {
        expect(result.current.data).toBe('milk');
      });

      // When
      rerender({ key: 'second' });

      // Then
      expect(result.current.data).toBe(shown);
    },
  );
});
