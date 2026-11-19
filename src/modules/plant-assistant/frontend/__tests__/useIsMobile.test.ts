import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useIsMobile } from '../useIsMobile.ts';
import { stubScreenWidth } from './screenWidth.ts';

describe('useIsMobile', () => {
  it('should be true when the screen is narrower than lg', () => {
    // Given
    stubScreenWidth(63.9);

    // When
    const { result } = renderHook(() => useIsMobile());

    // Then
    expect(result.current).toBe(true);
  });

  it('should be false when the screen is at least lg wide', () => {
    // Given
    stubScreenWidth(64);

    // When
    const { result } = renderHook(() => useIsMobile());

    // Then
    expect(result.current).toBe(false);
  });

  it('should follow a change of the screen width', () => {
    // Given
    const screen = stubScreenWidth(80);
    const { result } = renderHook(() => useIsMobile());

    // When
    act(() => {
      screen.resize(25);
    });

    // Then
    expect(result.current).toBe(true);
  });
});
