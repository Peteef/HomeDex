import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { stubScreenWidth } from '../../__tests__/screenWidth.ts';
import { useWideLayout } from '../useWideLayout.ts';

describe('useWideLayout', () => {
  it('should be true when the screen is at least lg wide', () => {
    // Given
    stubScreenWidth(64);

    // When
    const { result } = renderHook(() => useWideLayout());

    // Then
    expect(result.current).toBe(true);
  });

  it('should be false when it is narrower', () => {
    // Given
    stubScreenWidth(63.9);

    // When
    const { result } = renderHook(() => useWideLayout());

    // Then
    expect(result.current).toBe(false);
  });

  it('should follow a change of the screen width', () => {
    // Given
    const screen = stubScreenWidth(25);
    const { result } = renderHook(() => useWideLayout());

    // When
    act(() => {
      screen.resize(80);
    });

    // Then
    expect(result.current).toBe(true);
  });
});
