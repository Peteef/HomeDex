import { renderHook } from '@testing-library/react';
import type { MouseEvent, PointerEvent } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLongPress } from '../useLongPress.ts';

const pointer = (pointerType: string) => ({ pointerType }) as PointerEvent;

const click = () => {
  const preventDefault = vi.fn();
  return {
    event: { preventDefault } as unknown as MouseEvent,
    preventDefault,
  };
};

describe('useLongPress', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should call onLongPress when a touch is held for half a second', () => {
    // Given
    const onLongPress = vi.fn();
    const { result } = renderHook(() => useLongPress(onLongPress));

    // When
    result.current.onPointerDown(pointer('touch'));
    vi.advanceTimersByTime(500);

    // Then
    expect(onLongPress).toHaveBeenCalledOnce();
  });

  it('should not call onLongPress when the touch ends sooner', () => {
    // Given
    const onLongPress = vi.fn();
    const { result } = renderHook(() => useLongPress(onLongPress));

    // When
    result.current.onPointerDown(pointer('touch'));
    vi.advanceTimersByTime(300);
    result.current.onPointerUp();
    vi.advanceTimersByTime(500);

    // Then
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('should not call onLongPress when the touch turns into a scroll', () => {
    // Given
    const onLongPress = vi.fn();
    const { result } = renderHook(() => useLongPress(onLongPress));

    // When
    result.current.onPointerDown(pointer('touch'));
    result.current.onPointerCancel();
    vi.advanceTimersByTime(500);

    // Then
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('should ignore a held mouse button', () => {
    // Given
    const onLongPress = vi.fn();
    const { result } = renderHook(() => useLongPress(onLongPress));

    // When
    result.current.onPointerDown(pointer('mouse'));
    vi.advanceTimersByTime(500);

    // Then
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('should swallow the click that follows a long press', () => {
    // Given
    const { result } = renderHook(() => useLongPress(vi.fn()));
    const { event, preventDefault } = click();
    result.current.onPointerDown(pointer('touch'));
    vi.advanceTimersByTime(500);

    // When
    result.current.onClick(event);

    // Then
    expect(preventDefault).toHaveBeenCalledOnce();
  });

  it('should let a short tap click through', () => {
    // Given
    const { result } = renderHook(() => useLongPress(vi.fn()));
    const { event, preventDefault } = click();
    result.current.onPointerDown(pointer('touch'));
    result.current.onPointerUp();

    // When
    result.current.onClick(event);

    // Then
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('should block the context menu only when a long press does something', () => {
    // Given
    const withAction = renderHook(() => useLongPress(vi.fn())).result;
    const withoutAction = renderHook(() => useLongPress(undefined)).result;
    const blocked = click();
    const allowed = click();

    // When
    withAction.current.onContextMenu(blocked.event);
    withoutAction.current.onContextMenu(allowed.event);

    // Then
    expect(blocked.preventDefault).toHaveBeenCalledOnce();
    expect(allowed.preventDefault).not.toHaveBeenCalled();
  });

  it('should not call onLongPress after the component is gone', () => {
    // Given
    const onLongPress = vi.fn();
    const { result, unmount } = renderHook(() => useLongPress(onLongPress));
    result.current.onPointerDown(pointer('touch'));

    // When
    unmount();
    vi.advanceTimersByTime(500);

    // Then
    expect(onLongPress).not.toHaveBeenCalled();
  });
});
