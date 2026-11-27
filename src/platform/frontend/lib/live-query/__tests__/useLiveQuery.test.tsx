import { act, fireEvent, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { testQueryClient, withProviders } from '../../../__tests__/helpers.tsx';
import { useLiveQuery } from '../index.ts';

const QUERY_KEY = ['live-query', 'test'];

const renderLoaded = async (
  load: () => Promise<string>,
  interval: { refreshIntervalMs?: number } = {},
) => {
  const queryClient = testQueryClient();

  const wrapper = ({ children }: { children: ReactNode }) =>
    withProviders(children, { queryClient });

  const hook = renderHook(() => useLiveQuery({ queryKey: QUERY_KEY, queryFn: load, ...interval }), {
    wrapper,
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
});
