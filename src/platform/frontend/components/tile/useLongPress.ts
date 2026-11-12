import { useEffect, useRef, useState } from 'react';
import type { MouseEvent, PointerEvent } from 'react';

const LONG_PRESS_MS = 500;
const MOUSE = 'mouse';

export type PressPhase = 'idle' | 'holding' | 'held';

// A held touch calls onLongPress, and the click that follows the release is swallowed so the link
// does not open as well. Scrolling cancels the touch (pointercancel), so it never counts as a hold.
// The phase lets the tile show the hold, since iOS gives web pages no haptics.
export const useLongPress = (onLongPress: (() => void) | undefined) => {
  const timer = useRef<number | undefined>(undefined);
  const pressed = useRef(false);
  const [phase, setPhase] = useState<PressPhase>('idle');

  const clearTimer = (): void => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
  };

  useEffect(() => clearTimer, []);

  const stop = (): void => {
    clearTimer();
    setPhase((current) => (current === 'holding' ? 'idle' : current));
  };

  const fire = (): void => {
    pressed.current = true;
    setPhase('held');
    onLongPress?.();
  };

  const start = (event: PointerEvent): void => {
    pressed.current = false;
    setPhase('idle');

    if (onLongPress !== undefined && event.pointerType !== MOUSE) {
      setPhase('holding');
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
    phase,
    handlers: {
      onPointerDown: start,
      onPointerUp: stop,
      onPointerCancel: stop,
      onPointerLeave: stop,
      onClick: swallowClick,
      onContextMenu: blockMenu,
    },
  };
};
