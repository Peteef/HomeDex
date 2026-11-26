import { withProviders } from '#platform/frontend/testing';
import { skipToken } from '@tanstack/react-query';
import { act, fireEvent, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useLiveQuery } from '../useLiveQuery.ts';

const QUERY_KEY = ['plant-assistant', 'test'];

const wrapper = ({ children }: { children: ReactNode }) => withProviders(children);

const renderLoaded = async (load: () => Promise<string>) => {
  const hook = renderHook(() => useLiveQuery({ queryKey: QUERY_KEY, queryFn: load }), {
    wrapper,
  });

  await waitFor(() => {
    expect(hook.result.current.data).toBe('fern');
  });

  return hook;
};

describe('useLiveQuery', () => {
  it('should load the data', async () => {
    // Given
    const load = vi.fn(() => Promise.resolve('fern'));

    // When
    const { result } = await renderLoaded(load);

    // Then
    expect(result.current.data).toBe('fern');
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('should load again every 15 seconds', async () => {
    // Given
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const load = vi.fn(() => Promise.resolve('fern'));
    await renderLoaded(load);

    // When
    await act(() => vi.advanceTimersByTimeAsync(15_000));

    // Then
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('should load again when the window gets focus', async () => {
    // Given
    const load = vi.fn(() => Promise.resolve('fern'));
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
    const load = vi.fn(() => Promise.resolve('fern'));
    const { unmount } = await renderLoaded(load);
    unmount();

    // When
    fireEvent.focus(window);

    // Then
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('should stay quiet on focus when the query is skipped', () => {
    // Given
    const { result } = renderHook(
      () => useLiveQuery<string>({ queryKey: QUERY_KEY, queryFn: skipToken }),
      { wrapper },
    );

    // When
    fireEvent.focus(window);

    // Then
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
  });

  it.each([
    [true, 'fern'],
    [false, undefined],
  ])(
    'should show the previous answer while another key loads when keepPrevious is %s',
    async (keepPrevious, shown) => {
      // Given
      const loads: Record<string, () => Promise<string>> = {
        first: () => Promise.resolve('fern'),
        second: () => new Promise<string>(() => undefined),
      };

      const { result, rerender } = renderHook(
        ({ key }) =>
          useLiveQuery({
            queryKey: [...QUERY_KEY, key],
            queryFn: loads[key] ?? skipToken,
            keepPrevious,
          }),
        { wrapper, initialProps: { key: 'first' } },
      );

      await waitFor(() => {
        expect(result.current.data).toBe('fern');
      });

      // When
      rerender({ key: 'second' });

      // Then
      expect(result.current.data).toBe(shown);
    },
  );
});
