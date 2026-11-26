import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useNotice } from '../useNotice.ts';

describe('useNotice', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should show a notice and hide it after 6 seconds', () => {
    // Given
    const { result } = renderHook(() => useNotice<string>());

    // When
    act(() => {
      result.current.show('Watered.');
    });

    // Then
    expect(result.current.notice).toBe('Watered.');

    // When
    act(() => {
      vi.advanceTimersByTime(5_999);
    });

    // Then
    expect(result.current.notice).toBe('Watered.');

    // When
    act(() => {
      vi.advanceTimersByTime(1);
    });

    // Then
    expect(result.current.notice).toBeNull();
  });

  it('should keep the notice while paused and hide it 6 seconds after resuming', () => {
    // Given
    const { result } = renderHook(() => useNotice<string>());

    act(() => {
      result.current.show('Watered.');
      result.current.pause();
    });

    // When
    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    // Then
    expect(result.current.notice).toBe('Watered.');

    // When
    act(() => {
      result.current.resume();
    });

    act(() => {
      vi.advanceTimersByTime(6_000);
    });

    // Then
    expect(result.current.notice).toBeNull();
  });

  it('should replace the notice and give the new one its full time', () => {
    // Given
    const { result } = renderHook(() => useNotice<string>());

    act(() => {
      result.current.show('First.');
    });

    act(() => {
      vi.advanceTimersByTime(4_000);
    });

    // When
    act(() => {
      result.current.show('Second.');
    });

    act(() => {
      vi.advanceTimersByTime(4_000);
    });

    // Then
    expect(result.current.notice).toBe('Second.');
  });

  it('should hide the notice at once', () => {
    // Given
    const { result } = renderHook(() => useNotice<string>());

    act(() => {
      result.current.show('Watered.');
    });

    // When
    act(() => {
      result.current.hide();
    });

    // Then
    expect(result.current.notice).toBeNull();
  });
});
