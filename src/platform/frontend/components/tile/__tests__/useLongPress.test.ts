import { act, renderHook } from '@testing-library/react';
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
    result.current.handlers.onPointerDown(pointer('touch'));
    vi.advanceTimersByTime(500);

    // Then
    expect(onLongPress).toHaveBeenCalledOnce();
  });

  it('should not call onLongPress when the touch ends sooner', () => {
    // Given
    const onLongPress = vi.fn();
    const { result } = renderHook(() => useLongPress(onLongPress));

    // When
    result.current.handlers.onPointerDown(pointer('touch'));
    vi.advanceTimersByTime(300);
    result.current.handlers.onPointerUp();
    vi.advanceTimersByTime(500);

    // Then
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('should not call onLongPress when the touch turns into a scroll', () => {
    // Given
    const onLongPress = vi.fn();
    const { result } = renderHook(() => useLongPress(onLongPress));

    // When
    result.current.handlers.onPointerDown(pointer('touch'));
    result.current.handlers.onPointerCancel();
    vi.advanceTimersByTime(500);

    // Then
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('should ignore a held mouse button', () => {
    // Given
    const onLongPress = vi.fn();
    const { result } = renderHook(() => useLongPress(onLongPress));

    // When
    result.current.handlers.onPointerDown(pointer('mouse'));
    vi.advanceTimersByTime(500);

    // Then
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('should swallow the click that follows a long press', () => {
    // Given
    const { result } = renderHook(() => useLongPress(vi.fn()));
    const { event, preventDefault } = click();
    result.current.handlers.onPointerDown(pointer('touch'));
    vi.advanceTimersByTime(500);

    // When
    result.current.handlers.onClick(event);

    // Then
    expect(preventDefault).toHaveBeenCalledOnce();
  });

  it('should let a short tap click through', () => {
    // Given
    const { result } = renderHook(() => useLongPress(vi.fn()));
    const { event, preventDefault } = click();
    result.current.handlers.onPointerDown(pointer('touch'));
    result.current.handlers.onPointerUp();

    // When
    result.current.handlers.onClick(event);

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
    withAction.current.handlers.onContextMenu(blocked.event);
    withoutAction.current.handlers.onContextMenu(allowed.event);

    // Then
    expect(blocked.preventDefault).toHaveBeenCalledOnce();
    expect(allowed.preventDefault).not.toHaveBeenCalled();
  });

  it('should not call onLongPress after the component is gone', () => {
    // Given
    const onLongPress = vi.fn();
    const { result, unmount } = renderHook(() => useLongPress(onLongPress));
    result.current.handlers.onPointerDown(pointer('touch'));

    // When
    unmount();
    vi.advanceTimersByTime(500);

    // Then
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('should be idle until a touch starts', () => {
    // When
    const { result } = renderHook(() => useLongPress(vi.fn()));

    // Then
    expect(result.current.phase).toBe('idle');
  });

  it('should be holding while the touch is held and held once it fires', () => {
    // Given
    const { result } = renderHook(() => useLongPress(vi.fn()));

    // When
    act(() => {
      result.current.handlers.onPointerDown(pointer('touch'));
    });

    // Then
    expect(result.current.phase).toBe('holding');

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.phase).toBe('held');
  });

  it('should go back to idle when the touch ends before the hold fires', () => {
    // Given
    const { result } = renderHook(() => useLongPress(vi.fn()));

    act(() => {
      result.current.handlers.onPointerDown(pointer('touch'));
    });

    // When
    act(() => {
      result.current.handlers.onPointerUp();
    });

    // Then
    expect(result.current.phase).toBe('idle');
  });

  it('should stay held after the release, so the pop can finish', () => {
    // Given
    const { result } = renderHook(() => useLongPress(vi.fn()));

    act(() => {
      result.current.handlers.onPointerDown(pointer('touch'));
      vi.advanceTimersByTime(500);
    });

    // When
    act(() => {
      result.current.handlers.onPointerUp();
    });

    // Then
    expect(result.current.phase).toBe('held');
  });

  it('should not show a hold for a mouse or without onLongPress', () => {
    // Given
    const mouse = renderHook(() => useLongPress(vi.fn())).result;
    const noAction = renderHook(() => useLongPress(undefined)).result;

    // When
    act(() => {
      mouse.current.handlers.onPointerDown(pointer('mouse'));
      noAction.current.handlers.onPointerDown(pointer('touch'));
    });

    // Then
    expect(mouse.current.phase).toBe('idle');
    expect(noAction.current.phase).toBe('idle');
  });
});
