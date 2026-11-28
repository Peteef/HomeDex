import { Button } from '#platform/frontend';
import { createPortal } from 'react-dom';
import { useText } from '../../locales/index.ts';

export interface UndoNoticeProps {
  message: string | null;
  canUndo: boolean;
  undoing: boolean;
  onUndo: () => void;
  onPause: () => void;
  onResume: () => void;
}

// The live region stays in the page while it is empty, so screen readers announce each message.
// It is portaled out of the module's panel, whose backdrop blur would pin a fixed element to the
// panel; on phones it sits above the tab bar.
export const UndoNotice = ({
  message,
  canUndo,
  undoing,
  onUndo,
  onPause,
  onResume,
}: UndoNoticeProps) => {
  const text = useText('components.undoNotice');

  return createPortal(
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-20 flex justify-center px-4 lg:bottom-6"
    >
      {message !== null && (
        <div
          className="bg-dex-paper text-dex-ink shadow-panel border-dex-line pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border py-2 pr-2 pl-4"
          onPointerEnter={onPause}
          onPointerLeave={onResume}
          onFocus={onPause}
          onBlur={onResume}
        >
          <p className="min-w-0 flex-1 text-base font-bold break-words">{message}</p>
          {canUndo && (
            <Button variant="secondary" disabled={undoing} onClick={onUndo}>
              {text.undo}
            </Button>
          )}
        </div>
      )}
    </div>,
    document.body,
  );
};
