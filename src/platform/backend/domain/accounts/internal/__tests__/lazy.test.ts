import { describe, expect, it, vi } from 'vitest';
import { lazy } from '../lazy.ts';

describe('lazy', () => {
  it('should not compute when it has not been called yet', () => {
    // Given
    const compute = vi.fn(() => 42);

    // When
    lazy(compute);

    // Then
    expect(compute).not.toHaveBeenCalled();
  });

  it('should compute once and return the same value when it is called again', () => {
    // Given
    const compute = vi.fn(() => ({ answer: 42 }));
    const value = lazy(compute);

    // When
    const first = value();
    const second = value();

    // Then
    expect(second).toBe(first);
    expect(compute).toHaveBeenCalledTimes(1);
  });

  it('should compute once when the value is undefined', () => {
    // Given
    const compute = vi.fn<() => string | undefined>(() => undefined);
    const value = lazy(compute);

    // When
    value();
    const second = value();

    // Then
    expect(second).toBeUndefined();
    expect(compute).toHaveBeenCalledTimes(1);
  });
});
