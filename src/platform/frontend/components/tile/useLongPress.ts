import { useEffect, useRef } from 'react';
import type { MouseEvent, PointerEvent } from 'react';

const LONG_PRESS_MS = 500;
const MOUSE = 'mouse';

// A held touch calls onLongPress, and the click that follows the release is swallowed so the link
// does not open as well. Scrolling cancels the touch (pointercancel), so it never counts as a hold.
export const useLongPress = (onLongPress: (() => void) | undefined) => {
  const timer = useRef<number | undefined>(undefined);
  const pressed = useRef(false);

  const stop = (): void => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
  };

  useEffect(() => stop, []);

  const fire = (): void => {
    pressed.current = true;
    onLongPress?.();
  };

  const start = (event: PointerEvent): void => {
    pressed.current = false;

    if (onLongPress !== undefined && event.pointerType !== MOUSE) {
      timer.current = window.setTimeout(fire, LONG_PRESS_MS);
    }
  };

  const swallowClick = (event: MouseEvent): void => {
    if (pressed.current) {
      event.preventDefault();
      pressed.current = false;
    }
  };

  const blockMenu = (event: MouseEvent): void => {
    if (onLongPress !== undefined) {
      event.preventDefault();
    }
  };

  return {
    onPointerDown: start,
    onPointerUp: stop,
    onPointerCancel: stop,
    onPointerLeave: stop,
    onClick: swallowClick,
    onContextMenu: blockMenu,
  };
};
