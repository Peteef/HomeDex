import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTimeOfDay } from '../useTimeOfDay.ts';

const MINUTE_MS = 60 * 1000;

const setVisibility = (state: DocumentVisibilityState): void => {
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(state);
  document.dispatchEvent(new Event('visibilitychange'));
};

describe('useTimeOfDay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    window.history.replaceState(null, '', '/');
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should return the time and part of day of the current time', () => {
    // Given
    vi.setSystemTime(new Date(2026, 5, 1, 10, 30));

    // When
    const { result } = renderHook(() => useTimeOfDay());

    // Then
    expect(result.current).toEqual({ theme: 'day', partOfDay: 'morning' });
  });

  it('should switch to night when the clock reaches nine in the evening', () => {
    // Given
    vi.setSystemTime(new Date(2026, 5, 1, 20, 45));
    const { result } = renderHook(() => useTimeOfDay());

    // When
    act(() => {
      vi.advanceTimersByTime(15 * MINUTE_MS);
    });

    // Then
    expect(result.current).toEqual({ theme: 'night', partOfDay: 'evening' });
  });

  it('should keep checking at every full hour', () => {
    // Given
    vi.setSystemTime(new Date(2026, 5, 1, 4, 30));
    const { result } = renderHook(() => useTimeOfDay());

    // When
    for (const minutes of [30, 60, 60]) {
      act(() => {
        vi.advanceTimersByTime(minutes * MINUTE_MS);
      });
    }

    // Then
    expect(result.current).toEqual({ theme: 'day', partOfDay: 'morning' });
  });

  it('should check the time again when the app comes back to the foreground', () => {
    // Given
    vi.setSystemTime(new Date(2026, 5, 1, 22, 30));
    const { result } = renderHook(() => useTimeOfDay());
    setVisibility('hidden');
    vi.setSystemTime(new Date(2026, 5, 2, 8, 0));

    // When
    act(() => {
      setVisibility('visible');
    });

    // Then
    expect(result.current).toEqual({ theme: 'day', partOfDay: 'morning' });
  });

  it('should keep the time while the app is in the background', () => {
    // Given
    vi.setSystemTime(new Date(2026, 5, 1, 22, 30));
    const { result } = renderHook(() => useTimeOfDay());
    vi.setSystemTime(new Date(2026, 5, 2, 8, 0));

    // When
    act(() => {
      setVisibility('hidden');
    });

    // Then
    expect(result.current).toEqual({ theme: 'night', partOfDay: 'evening' });
  });

  it('should follow the dev hour when it is set', async () => {
    // Given
    vi.setSystemTime(new Date(2026, 5, 1, 10, 30));
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    window.history.replaceState(null, '', '/?dev-hour=23');
    vi.resetModules();
    const { useTimeOfDay: useFreshTimeOfDay } = await import('../useTimeOfDay.ts');

    // When
    const { result } = renderHook(() => useFreshTimeOfDay());

    // Then
    expect(result.current).toEqual({ theme: 'night', partOfDay: 'night' });
  });

  it('should stop checking when it is unmounted', () => {
    // Given
    vi.setSystemTime(new Date(2026, 5, 1, 10, 30));
    const { unmount } = renderHook(() => useTimeOfDay());

    // When
    unmount();

    // Then
    expect(vi.getTimerCount()).toBe(0);
  });
});
